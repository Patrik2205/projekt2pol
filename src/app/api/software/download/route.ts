import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

function detectOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'MacOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  return 'Unknown'
}

// Helper function to extract original filename and extension from S3 key or download URL
function getOriginalFileName(downloadUrl: string, versionNumber: string): string {
  try {
    // Extract the filename from the S3 URL
    let filename: string;
    
    if (downloadUrl.includes('/')) {
      // Get the last part of the URL path
      filename = downloadUrl.split('/').pop() || '';
    } else {
      filename = downloadUrl;
    }
    
    // If we have a filename with extension, extract just the extension
    if (filename.includes('.')) {
      const extension = filename.split('.').pop();
      return `${versionNumber}.${extension}`;
    }
    
    // Fallback to .exe if no extension found
    return `${versionNumber}.exe`;
  } catch (error) {
    console.error('Error extracting filename:', error);
    return `${versionNumber}.exe`;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const json = await request.json()
    const { versionId } = json

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 })
    }

    const version = await prisma.softwareVersion.findUnique({
      where: { id: versionId }
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    try {
      // Record download statistics
      await prisma.downloadStatistic.create({
        data: {
          versionId,
          userId: session?.user ? parseInt(session.user.id) : null,
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          osType: detectOS(request.headers.get('user-agent') || ''),
          countryCode: request.headers.get('cf-ipcountry')
        }
      })
    } catch (statError) {
      console.error('Error recording download statistics:', statError)
    }

    // Extract S3 key from download URL
    let s3Key: string
    if (version.downloadUrl.includes('cloudfront')) {
      // CloudFront URL format
      s3Key = version.downloadUrl.split('/').slice(3).join('/')
    } else if (version.downloadUrl.includes('s3.')) {
      // Direct S3 URL format
      s3Key = version.downloadUrl.split('/').slice(3).join('/')
    } else {
      // Assume it's just the key if it doesn't match expected formats
      s3Key = version.downloadUrl.replace(/^\/+/, '')
    }

    const originalFileName = getOriginalFileName(version.downloadUrl, version.versionNumber);

    // Option 1: Generate presigned URL for direct S3 access (recommended for large files)
    if (process.env.USE_PRESIGNED_URLS === 'true') {
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: s3Key,
          ResponseContentDisposition: `attachment; filename="${originalFileName}"`
        })

        // Generate presigned URL valid for 1 hour
        const presignedUrl = await getSignedUrl(s3Client, command, { 
          expiresIn: 3600 // 1 hour
        })

        return NextResponse.json(convertBigInts({
          downloadUrl: presignedUrl,
          checksum: version.checksum,
          fileName: originalFileName,
          versionNumber: version.versionNumber,
          method: 'presigned'
        }))

      } catch (s3Error) {
        console.error('Error generating presigned URL:', s3Error)
        return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
      }
    }

    // Option 2: Return direct CloudFront/S3 URL (fastest, but less control)
    return NextResponse.json(convertBigInts({
      downloadUrl: version.downloadUrl,
      checksum: version.checksum,
      fileName: originalFileName,
      versionNumber: version.versionNumber,
      method: 'direct'
    }))

  } catch (error) {
    console.error('Error processing download:', error)
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 })
  }
}