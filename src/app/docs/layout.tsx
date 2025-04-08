import DocsHeader from '@/components/docs/DocsHeader'
import DocsSidebar from '@/components/docs/DocsSidebar'
import { prisma } from '@/app/api/lib/prisma'

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
      <DocsHeader />
      <DocsSidebar sections={sections} />
      <main className="ml-64 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
} 