import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  try {
    const versions = await prisma.softwareVersion.findMany({
        include: {
          releasePost: true,
          downloads: true, // Changed from {select: {count: true}}
          _count: {
            select: {
              downloads: true
            }
          }
        },
        orderBy: {
          releaseDate: 'desc'
        }
    })    
    return NextResponse.json(versions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const json = await request.json()
    const { versionNumber, downloadUrl, checksum, sizeBytes, minRequirements, changelog, releasePostId } = json

    const version = await prisma.softwareVersion.create({
      data: {
        versionNumber,
        downloadUrl,
        checksum,
        sizeBytes,
        minRequirements,
        changelog,
        releasePostId,
        isLatest: true
      }
    })

    await prisma.softwareVersion.updateMany({
      where: {
        id: { not: version.id },
        isLatest: true
      },
      data: {
        isLatest: false
      }
    })

    return NextResponse.json(version)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
  }
}