import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

// Helper function to convert BigInt to string in objects
function convertBigInts(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString(); // Convert BigInt to string
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
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          osType: detectOS(request.headers.get('user-agent') || ''),
          countryCode: request.headers.get('cf-ipcountry')
        }
      })
    } catch (statError) {
      // Log error but continue - don't fail the download if stats recording fails
      console.error('Error recording download statistics:', statError)
    }

    // Convert BigInt values in response
    const response = {
      downloadUrl: version.downloadUrl,
      checksum: version.checksum
    }
    
    return NextResponse.json(convertBigInts(response))
  } catch (error) {
    console.error('Error processing download:', error)
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 })
  }
}

function detectOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'MacOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  return 'Unknown'
}