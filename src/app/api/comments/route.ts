import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getSession } from 'next-auth/react'

export async function GET() {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        post: {
          select: {
            title: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to comment' },
        { status: 401 }
      )
    }

    const json = await request.json()
    const { postId, content } = json

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: parseInt(session.user.id),
        isApproved: false
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}