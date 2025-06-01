import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Find all top-level comments for this post
    const comments = await prisma.comment.findMany({
      where: {
        postId: parseInt(postId),
        commentType: 'postComment',
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
          where: {
            commentType: 'postComment'
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching post comments:', error)
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
    const { postId, content, parentId } = json

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
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
        commentType: 'postComment',
        postId: parseInt(postId),
        userId: parseInt(session.user.id),
        parentId: parentId ? parseInt(parentId) : null,
        isApproved: false // Require approval for blog comments (can be auto-approved for admins later)
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

    // Check if the user is an admin and auto-approve their comments
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { isAdmin: true }
    })

    if (user?.isAdmin) {
      await prisma.comment.update({
        where: { id: comment.id },
        data: { isApproved: true }
      })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating post comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}