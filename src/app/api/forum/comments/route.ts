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
        { error: 'Forum post ID is required', comments: [] },
        { status: 400 }
      )
    }

    // Check if the forum post exists
    try {
      const forumPost = await prisma.forumPost.findUnique({
        where: { id: parseInt(forumPostId) }
      })

      if (!forumPost) {
        return NextResponse.json(
          { error: 'Forum post not found', comments: [] },
          { status: 404 }
        )
      }
    } catch (dbError) {
      console.error('Database error finding forum post:', dbError)
      return NextResponse.json(
        { error: 'Database error finding forum post', comments: [] },
        { status: 500 }
      )
    }

    // Check if CommentType exists in the database
    let hasCommentType = true;
    try {
      // We'll attempt a simple query to check if the CommentType enum exists
      const testComment = await prisma.comment.findFirst({
        where: {},
        select: { id: true }
      });
      
      // If we get here, the query succeeded but we need to check if commentType exists
      // This is more complex than it seems since we can't directly check schema
      hasCommentType = true; // Assume it exists for now
    } catch (typeError) {
      console.error('Error checking CommentType existence:', typeError);
      hasCommentType = false;
    }

    if (!hasCommentType) {
      return NextResponse.json({
        message: "Comment system requires database schema update. The CommentType enum is missing.",
        comments: []
      });
    }

    // Try to find comments for this forum post
    try {
      // Handle both cases: with and without commentType
      let comments;
      if (hasCommentType) {
        // If commentType exists, use it in the query
        comments = await prisma.comment.findMany({
          where: {
            forumPostId: parseInt(forumPostId),
            commentType: 'forumComment',
            parentId: null
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
        });
      } else {
        // If commentType doesn't exist yet, use a simpler query
        comments = await prisma.comment.findMany({
          where: {
            forumPostId: parseInt(forumPostId),
            parentId: null
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
            createdAt: 'desc'
          }
        });
      }

      return NextResponse.json({ comments });
    } catch (dbError) {
      console.error('Error finding comments:', dbError);
      return NextResponse.json(
        { 
          error: 'Database error finding comments', 
          details: dbError instanceof Error ? dbError.message : String(dbError),
          comments: [] 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching forum comments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch comments', 
        details: error instanceof Error ? error.message : String(error),
        comments: [] 
      },
      { status: 500 }
    );
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

    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { forumPostId, content, parentId } = requestData;

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
    try {
      // Check if our schema has the commentType field
      let hasCommentType = true;
      try {
        // This is a simplistic check - in a real application you might want a more robust solution
        const testComment = await prisma.comment.findFirst({
          where: {},
          select: { id: true }
        });
        hasCommentType = true; // Assume it exists
      } catch (typeError) {
        console.error('Error checking CommentType existence:', typeError);
        hasCommentType = false;
      }

      let comment;
      if (hasCommentType) {
        // Create with commentType if it exists
        comment = await prisma.comment.create({
          data: {
            content,
            commentType: 'forumComment',
            forumPostId: parseInt(forumPostId),
            userId: parseInt(session.user.id),
            parentId: parentId ? parseInt(parentId) : null,
            isApproved: true // Auto-approve forum comments
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
        });
      } else {
        // Create without commentType if it doesn't exist yet
        comment = await prisma.comment.create({
          data: {
            content,
            forumPostId: parseInt(forumPostId),
            userId: parseInt(session.user.id),
            parentId: parentId ? parseInt(parentId) : null,
            isApproved: true
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
        });
      }

      return NextResponse.json(comment);
    } catch (dbError) {
      console.error('Error creating comment:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to create comment',
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating forum comment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create comment',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}