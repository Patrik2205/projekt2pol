// src/app/api/forum/comments/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const commentId = parseInt(id, 10)

    const comment = await prisma.comment.findUnique({
      where: { 
        id: commentId,
        commentType: 'forumComment'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        replies: {
          where: {
            commentType: 'forumComment'
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
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
    console.error('Error fetching forum comment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update a comment' },
        { status: 401 }
      )
    }

    const { id } = await params
    const commentId = parseInt(id, 10)
    const json = await request.json()
    const { content } = json

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Check if the comment exists and belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { 
        id: commentId,
        commentType: 'forumComment'
      },
      select: { userId: true }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.userId !== parseInt(session.user.id)) {
      // Check if the user is an admin
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        select: { isAdmin: true }
      })
      
      if (!user?.isAdmin) {
        return NextResponse.json(
          { error: 'You can only edit your own comments' },
          { status: 403 }
        )
      }
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Error updating forum comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a comment' },
        { status: 401 }
      )
    }

    const { id } = await params
    const commentId = parseInt(id, 10)

    // Check if the comment exists
    const comment = await prisma.comment.findUnique({
      where: { 
        id: commentId,
        commentType: 'forumComment'
      },
      select: { userId: true }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if the user is authorized to delete this comment
    const userId = parseInt(session.user.id)
    if (comment.userId !== userId) {
      // Check if the user is an admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true }
      })
      
      if (!user?.isAdmin) {
        return NextResponse.json(
          { error: 'You can only delete your own comments' },
          { status: 403 }
        )
      }
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting forum comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}