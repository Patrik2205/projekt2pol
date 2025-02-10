import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postType = searchParams.get('type')

    const posts = await prisma.post.findMany({
      where: postType ? { postType: postType as 'blogPost' | 'newRelease' } : {},
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const json = await request.json()
    const { title, content, postType, tags } = json

    const post = await prisma.post.create({
      data: {
        title,
        content,
        postType,
        authorId: parseInt(session.user.id),
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        tags: {
          create: tags?.map((tagId: number) => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        }
      },
      include: {
        author: {
          select: {
            username: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}