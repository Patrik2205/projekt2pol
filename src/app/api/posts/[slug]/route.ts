import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!params.slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    console.log('Fetching post with slug:', params.slug)

    const post = await prisma.post.findUnique({
      where: { 
        slug: params.slug,
        isPublished: true // Přidáno pro zobrazení pouze publikovaných příspěvků
      },
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    })

    if (!post) {
      console.log('Post not found for slug:', params.slug)
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
} 