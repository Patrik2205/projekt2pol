import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getSession } from 'next-auth/react'

type RouteParams = { params: { id: string } }

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const id = parseInt(params.id)

    const comment = await prisma.comment.findUnique({
      where: { id },
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

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(comment)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getSession()
    const id = parseInt(params.id)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update comments' },
        { status: 401 }
      )
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Not authorized to update this comment' },
        { status: 403 }
      )
    }

    const json = await request.json()
    const { content } = json

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getSession()
    const id = parseInt(params.id)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete comments' },
        { status: 401 }
      )
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Not authorized to delete this comment' },
        { status: 403 }
      )
    }

    await prisma.comment.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Comment deleted successfully' }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}