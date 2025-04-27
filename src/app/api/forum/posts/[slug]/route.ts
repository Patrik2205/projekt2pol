// src/app/api/forum/posts/[slug]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const post = await prisma.forumPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            username: true,
            email: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Forum post not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.forumPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching forum post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forum post' },
      { status: 500 }
    )
  }
}