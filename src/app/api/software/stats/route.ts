import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

export async function GET() {
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

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalDownloads, downloadsToday, downloadsThisWeek, downloadsThisMonth] = await Promise.all([
      prisma.downloadStatistic.count(),
      prisma.downloadStatistic.count({
        where: {
          downloadDate: {
            gte: startOfToday
          }
        }
      }),
      prisma.downloadStatistic.count({
        where: {
          downloadDate: {
            gte: startOfWeek
          }
        }
      }),
      prisma.downloadStatistic.count({
        where: {
          downloadDate: {
            gte: startOfMonth
          }
        }
      })
    ])

    return NextResponse.json({
      totalDownloads,
      downloadsToday,
      downloadsThisWeek,
      downloadsThisMonth
    })
  } catch (error) {
    console.error('Error fetching download stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}