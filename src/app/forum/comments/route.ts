// src/app/api/forum/comments/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forumPostId = searchParams.get('forumPostId')
    
    if (!forumPostId) {
      return NextResponse.json(
        { error: 'Forum post ID is required' },
        { status: 400 }
      )
    }

    // Check if the forum post exists
    const forumPost = await prisma.forumPost.findUnique({
      where: { id: parseInt(forumPostId) }
    })

    if (!forumPost) {
      return NextResponse.json(
        { error: 'Forum post not found' },
        { status: 404 }
      )
    }

    // Find all top-level comments for this forum post
    const comments = await prisma.comment.findMany({
      where: {
        forumPostId: parseInt(forumPostId),
        commentType: 'forumComment',
        parentId: null // Only fetch top-level comments
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching forum comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to comment' },
        { status: 401 }
      )
    }

    const json = await request.json()
    const { forumPostId, content, parentId } = json

    if (!forumPostId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if the forum post exists
    const forumPost = await prisma.forumPost.findUnique({
      where: { id: parseInt(forumPostId) }
    })

    if (!forumPost) {
      return NextResponse.json(
        { error: 'Forum post not found' },
        { status: 404 }
      )
    }

    // If it's a reply, check if the parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parseInt(parentId) }
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        commentType: 'forumComment',
        forumPostId: parseInt(forumPostId),
        userId: parseInt(session.user.id),
        parentId: parentId ? parseInt(parentId) : null,
        isApproved: true // Auto-approve forum comments (can be adjusted based on requirements)
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

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating forum comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}