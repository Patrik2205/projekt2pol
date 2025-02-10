import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const doc = await prisma.documentationSection.findUnique({
      where: { id },
      include: {
        subSections: true,
        parentSection: true
      }
    })

    if (!doc) {
      return NextResponse.json(
        { error: 'Documentation section not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(doc)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch documentation section' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const json = await request.json()
    const { title, content, parentSectionId, orderIndex } = json

    const doc = await prisma.documentationSection.update({
      where: { id },
      data: {
        title,
        content,
        parentSectionId,
        orderIndex,
        slug: title.toLowerCase().replace(/\s+/g, '-')
      }
    })

    return NextResponse.json(doc)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update documentation section' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    await prisma.documentationSection.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Documentation section deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete documentation section' },
      { status: 500 }
    )
  }
}