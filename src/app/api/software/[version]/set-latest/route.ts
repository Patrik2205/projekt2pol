import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

export async function POST(request: Request, { params }: { params: Promise<{ version: string }> }) {
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

    const { version: versionParam } = await params
    
    // Check if this is a numeric ID or version string
    const isNumericId = /^\d+$/.test(versionParam)
    
    let versionId: number;
    
    if (isNumericId) {
      // It's an ID
      versionId = parseInt(versionParam)
    } else {
      // It's a version number, find the ID
      const versionRecord = await prisma.softwareVersion.findFirst({
        where: { versionNumber: versionParam }
      })
      
      if (!versionRecord) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 })
      }
      
      versionId = versionRecord.id
    }

    // Set all versions to not latest
    await prisma.softwareVersion.updateMany({
      data: { isLatest: false }
    })

    // Set the specified version as latest
    const updatedVersion = await prisma.softwareVersion.update({
      where: { id: versionId },
      data: { isLatest: true }
    })

    return NextResponse.json({ message: 'Version set as latest', version: updatedVersion })
  } catch (error) {
    console.error('Error setting version as latest:', error)
    return NextResponse.json({ error: 'Failed to update version' }, { status: 500 })
  }
}