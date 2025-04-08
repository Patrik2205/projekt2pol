import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    const [posts, comments, downloads] = await Promise.all([
      prisma.post.count({
        where: { authorId: userId }
      }),
      prisma.comment.count({
        where: { userId: userId }
      }),
      prisma.downloadStatistic.count({
        where: { userId: userId }
      })
    ])

    return NextResponse.json({
      totalPosts: posts,
      totalComments: comments,
      totalDownloads: downloads
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
} 