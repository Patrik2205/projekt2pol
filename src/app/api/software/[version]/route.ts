import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

export async function GET(request: Request, { params }: { params: { version: string } }) {
  try {
    const version = await prisma.softwareVersion.findFirst({
      where: {
        versionNumber: params.version
      },
      include: {
        releasePost: true,
        downloads: true
      }
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    return NextResponse.json(version)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 })
  }
}