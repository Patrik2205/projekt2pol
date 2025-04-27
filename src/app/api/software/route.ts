import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'

// Helper function to convert BigInt to string in an object
function convertBigInts(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString(); // Convert BigInt to string
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigInts(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigInts(obj[key]);
    }
    return result;
  }
  
  return obj;
}

export async function GET() {
  try {
    const versions = await prisma.softwareVersion.findMany({
      include: {
        releasePost: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        releaseDate: 'desc'
      }
    });    
    
    // Convert BigInt values to strings before returning
    const processedVersions = convertBigInts(versions);
    
    return NextResponse.json(processedVersions);
  } catch (error) {
    console.error('Error fetching software versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { versionNumber, downloadUrl, checksum, sizeBytes, minRequirements, changelog, releasePostId } = json;

    const version = await prisma.softwareVersion.create({
      data: {
        versionNumber,
        downloadUrl,
        checksum,
        sizeBytes,
        minRequirements,
        changelog,
        releasePostId,
        isLatest: true
      }
    });

    await prisma.softwareVersion.updateMany({
      where: {
        id: { not: version.id },
        isLatest: true
      },
      data: {
        isLatest: false
      }
    });

    // Convert BigInt values before returning
    const processedVersion = convertBigInts(version);
    
    return NextResponse.json(processedVersion);
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}