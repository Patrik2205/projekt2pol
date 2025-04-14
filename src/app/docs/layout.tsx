import { Suspense } from 'react'
import DocsHeaderWrapper from './layout-wrapper'
import DocsSidebar from '@/components/docs/DocsSidebar'
import { prisma } from '@/app/api/lib/prisma'

type DocumentationSection = {
  id: number
  title: string
  slug: string
  content: string
  parentSectionId: number | null
  orderIndex: number
  createdAt: Date
  updatedAt: Date
  subSections?: DocumentationSection[]
}

async function getDocSections() {
  const sections = await prisma.documentationSection.findMany({
    where: {
      parentSectionId: null
    },
    include: {
      subSections: {
        include: {
          subSections: true
        }
      }
    },
    orderBy: {
      orderIndex: 'asc'
    }
  })
  return sections
}

export default async function DocsLayout({
  children
}: {
  children: React.ReactNode
}) {
  const sections = await getDocSections()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DocsHeaderWrapper />
      <Suspense fallback={
        <div className="w-64 h-screen fixed left-0 top-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          </div>
        </div>
      }>
        <DocsSidebar sections={sections} />
      </Suspense>
      <main className="ml-64 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}