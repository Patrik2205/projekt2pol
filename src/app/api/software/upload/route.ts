import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"
import { prisma } from '@/app/api/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const versionNumber = formData.get('versionNumber') as string
    const minRequirements = formData.get('minRequirements') as string
    const changelog = formData.get('changelog') as string
    const releasePostId = formData.get('releasePostId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!versionNumber) {
      return NextResponse.json({ error: 'Version number is required' }, { status: 400 })
    }

    const existingVersion = await prisma.softwareVersion.findFirst({
      where: { versionNumber }
    })

    if (existingVersion) {
      return NextResponse.json({ error: 'Version already exists' }, { status: 400 })
    }

    // Validate file size (AWS S3 has 5GB limit for single upload)
    const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE || '5368709120') // 5GB default
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024 / 1024)}GB` 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['.exe', '.msi', '.zip']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ 
        error: 'Only .exe, .msi, and .zip files are allowed' 
      }, { status: 400 })
    }

    // Generate unique filename with timestamp to avoid conflicts
    const timestamp = Date.now()
    const sanitizedVersion = versionNumber.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${sanitizedVersion}-${timestamp}-${file.name}`
    const s3Key = `software/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex')

    try {
      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3Key,
        Body: buffer,
        ContentType: 'application/octet-stream',
        ContentDisposition: `attachment; filename="${file.name}"`,
        Metadata: {
          'original-name': file.name,
          'version': versionNumber,
          'uploaded-by': session.user.id,
          'checksum': checksum
        },
        ServerSideEncryption: 'AES256',
      })

      await s3Client.send(uploadCommand)

      const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN
      const downloadUrl = cloudFrontDomain 
        ? `https://${cloudFrontDomain}/${s3Key}`
        : `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`

      const newVersion = await prisma.softwareVersion.create({
        data: {
          versionNumber,
          downloadUrl,
          checksum,
          sizeBytes: BigInt(buffer.length),
          minRequirements: minRequirements || null,
          changelog: changelog || null,
          releasePostId: releasePostId ? parseInt(releasePostId) : null,
          isLatest: true
        }
      })

      await prisma.softwareVersion.updateMany({
        where: {
          id: { not: newVersion.id }
        },
        data: {
          isLatest: false
        }
      })

      return NextResponse.json({ 
        message: 'File uploaded successfully to S3',
        version: {
          ...newVersion,
          sizeBytes: newVersion.sizeBytes.toString() // Convert BigInt to string
        },
        s3Key,
        downloadUrl
      })

    } catch (s3Error) {
      console.error('S3 upload error:', s3Error)
      return NextResponse.json({ 
        error: 'Failed to upload to S3. Please check your AWS configuration.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}