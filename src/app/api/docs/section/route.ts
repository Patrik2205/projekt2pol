import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    
    let section;
    
    if (slug) {
      // Fetch specific section by slug
      section = await prisma.documentationSection.findFirst({
        where: {
          slug: slug
        }
      });
      
      if (!section) {
        return NextResponse.json(
          { error: 'Documentation section not found' },
          { status: 404 }
        );
      }
    } else {
      // Fetch default section (first one)
      section = await prisma.documentationSection.findFirst({
        where: {
          parentSectionId: null
        },
        orderBy: {
          orderIndex: 'asc'
        }
      });
      
      if (!section) {
        return NextResponse.json(
          { error: 'No documentation sections found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(section);
  } catch (error) {
    console.error('Error fetching documentation section:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documentation section' },
      { status: 500 }
    );
  }
}