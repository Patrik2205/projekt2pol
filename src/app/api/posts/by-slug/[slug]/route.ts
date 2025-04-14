import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const post = await prisma.post.findUnique({
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
        },
        comments: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post by slug:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}