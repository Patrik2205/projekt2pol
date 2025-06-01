import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Helper function to convert BigInt to string in objects
function convertBigInts(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigInts(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigInts(obj[key]);
    }
    return result;
  }
  
  return obj;
}

export async function GET(request: Request, { params }: { params: Promise<{ version: string }> }) {
  try {
    const { version } = await params;

    const versionRecord = await prisma.softwareVersion.findFirst({
      where: {
        versionNumber: version
      },
      include: {
        releasePost: true,
        downloads: true
      }
    })

    if (!versionRecord) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Convert BigInt values before returning
    const processedVersion = convertBigInts(versionRecord);

    return NextResponse.json(processedVersion)
  } catch (error) {
    console.error('Error fetching version:', error)
    return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ version: string }> }) {
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

    const { version } = await params;
    
    // Check if this is a numeric ID or version string
    const isNumericId = /^\d+$/.test(version)
    
    let versionRecord;
    
    if (isNumericId) {
      // It's an ID - this is what the dashboard sends
      const versionId = parseInt(version)
      versionRecord = await prisma.softwareVersion.findUnique({
        where: { id: versionId }
      })
    } else {
      // It's a version number string
      versionRecord = await prisma.softwareVersion.findFirst({
        where: { versionNumber: version }
      })
    }

    if (!versionRecord) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // First, delete all related download statistics to avoid foreign key constraint violation
    try {
      await prisma.downloadStatistic.deleteMany({
        where: { versionId: versionRecord.id }
      })
      console.log(`Deleted download statistics for version ${versionRecord.versionNumber}`)
    } catch (statsError) {
      console.error('Error deleting download statistics:', statsError)
      return NextResponse.json({ 
        error: 'Failed to delete related download statistics' 
      }, { status: 500 })
    }

    // Then delete the software version from database
    try {
      await prisma.softwareVersion.delete({
        where: { id: versionRecord.id }
      })
      console.log(`Deleted software version ${versionRecord.versionNumber} from database`)
    } catch (dbError) {
      console.error('Error deleting from database:', dbError)
      return NextResponse.json({ 
        error: 'Failed to delete software version from database' 
      }, { status: 500 })
    }

    // Finally, try to delete from S3
    try {
      // Extract S3 key from download URL
      let s3Key: string
      
      if (versionRecord.downloadUrl.includes('cloudfront')) {
        // CloudFront URL format: https://d1234567890.cloudfront.net/software/filename.exe
        s3Key = versionRecord.downloadUrl.split('/').slice(3).join('/')
      } else if (versionRecord.downloadUrl.includes('s3.')) {
        // Direct S3 URL format: https://bucket.s3.region.amazonaws.com/software/filename.exe
        s3Key = versionRecord.downloadUrl.split('/').slice(3).join('/')
      } else if (versionRecord.downloadUrl.startsWith('software/')) {
        // Already just the key
        s3Key = versionRecord.downloadUrl
      } else {
        // Fallback - assume the URL contains the key after domain
        s3Key = versionRecord.downloadUrl.replace(/^https?:\/\/[^\/]+\//, '')
      }

      console.log(`Attempting to delete S3 object: ${s3Key}`)

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3Key
      })

      await s3Client.send(deleteCommand)
      console.log(`Successfully deleted S3 object: ${s3Key}`)

    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error)
      // Log the error but don't fail the request since database cleanup was successful
      // The database record is already deleted, which is the most important part
    }

    return NextResponse.json({ 
      message: 'Version deleted successfully',
      deletedVersion: versionRecord.versionNumber 
    })
    
  } catch (error) {
    console.error('Error deleting version:', error)
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 })
  }
}