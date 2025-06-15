import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

export async function GET() {
  try {
    const docs = await prisma.documentationSection.findMany({
      include: {
        subSections: true
      },
      where: {
        parentSectionId: null
      },
      orderBy: {
        orderIndex: 'asc'
      }
    })
    return NextResponse.json(docs)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch documentation' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { title, content, parentSectionId } = json

    const max = await prisma.documentationSection.aggregate({
      _max: { orderIndex: true }
    })
    const nextIndex = (max._max.orderIndex ?? 0) + 1

    const doc = await prisma.documentationSection.create({
      data: {
        title,
        content,
        parentSectionId,
        orderIndex: nextIndex,
        slug: title.toLowerCase().replace(/\s+/g, '-')
      }
    })
    return NextResponse.json(doc)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create documentation section' },
      { status: 500 }
    )
  }
}