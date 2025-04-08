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
    console.log('Session user ID:', userId)

    // Získáme všechny posty uživatele bez filtru typu
    const posts = await prisma.post.findMany({
      where: { 
        authorId: userId
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        slug: true,
        postType: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Found posts:', posts)

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error in /api/posts/user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user posts' },
      { status: 500 }
    )
  }
} 