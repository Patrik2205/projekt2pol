import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json([])
    }

    const results = await prisma.documentationSection.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true
      },
      orderBy: {
        title: 'asc'
      },
      take: 5
    })

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search documentation' },
      { status: 500 }
    )
  }
} 