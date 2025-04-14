'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

type Section = {
  id: number
  title: string
  slug: string
  subSections: Section[]  // This needs to be updated
}

// Create a more flexible type that matches what Prisma returns
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

type DocsSidebarProps = {
  sections: DocumentationSection[]  // Updated prop type
}

function SectionItem({ section, level = 0 }: { section: DocumentationSection, level?: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasSubSections = section.subSections && section.subSections.length > 0
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if (hasSubSections) {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
  }

  const handleSectionClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push(`/docs?section=${section.slug}`)
  }

  return (
    <div className="w-full">
      <div 
        className={`flex items-center py-2 px-${level * 4} hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`}
        onClick={handleClick}
      >
        {hasSubSections && (
          <span className="mr-2">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        <a 
          href="#"
          onClick={handleSectionClick}
          className="flex-grow"
        >
          {section.title}
        </a>
      </div>
      
      {isExpanded && hasSubSections && section.subSections && (
        <div className="ml-4">
          {section.subSections.map(subSection => (
            <SectionItem 
              key={subSection.id} 
              section={subSection} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DocsSidebar({ sections }: DocsSidebarProps) {
  const searchParams = useSearchParams()
  const currentSection = searchParams.get('section')

  return (
    <nav className="w-64 h-screen fixed left-0 top-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4">
        {sections.map(section => (
          <SectionItem key={section.id} section={section} />
        ))}
      </div>
    </nav>
  )
}