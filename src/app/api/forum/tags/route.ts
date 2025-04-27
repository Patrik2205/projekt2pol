// src/app/api/forum/tags/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

export async function GET() {
  try {
    const tags = await prisma.forumTag.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching forum tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forum tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { name } = json

    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      )
    }

    // Check if tag with this name already exists
    const existingTag = await prisma.forumTag.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })

    if (existingTag) {
      return NextResponse.json(existingTag)
    }

    // Create a new tag
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    
    const tag = await prisma.forumTag.create({
      data: {
        name,
        slug
      }
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error creating forum tag:', error)
    return NextResponse.json(
      { error: 'Failed to create forum tag' },
      { status: 500 }
    )
  }
}