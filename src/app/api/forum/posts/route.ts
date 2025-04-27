// src/app/api/forum/posts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const tagsParam = searchParams.get('tags')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Parse tag IDs
    const tagIds = tagsParam
      ? tagsParam.split(',').map(id => parseInt(id, 10))
      : []

    // Prepare the where clause
    const where: any = {}

    if (query) {
      where.title = {
        contains: query,
        mode: 'insensitive'
      }
    }

    if (tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: tagIds
          }
        }
      }
    }

    const posts = await prisma.forumPost.findMany({
      where,
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
      },
      skip,
      take: limit
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching forum posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forum posts' },
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
    const { title, content, tags } = json

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const post = await prisma.forumPost.create({
      data: {
        title,
        content,
        authorId: parseInt(session.user.id),
        slug: title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
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
    console.error('Error creating forum post:', error)
    return NextResponse.json(
      { error: 'Failed to create forum post' },
      { status: 500 }
    )
  }
}