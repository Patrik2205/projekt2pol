import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const json = await request.json()
    const { versionId } = json

    const version = await prisma.softwareVersion.findUnique({
      where: { id: versionId }
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    await prisma.downloadStatistic.create({
      data: {
        versionId,
        userId: session?.user ? parseInt(session.user.id) : null,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        osType: detectOS(request.headers.get('user-agent') || ''),
        countryCode: request.headers.get('cf-ipcountry')
      }
    })

    return NextResponse.json({ 
      downloadUrl: version.downloadUrl,
      checksum: version.checksum
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 })
  }
}

function detectOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'MacOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS')) return 'iOS'
  return 'Unknown'
}