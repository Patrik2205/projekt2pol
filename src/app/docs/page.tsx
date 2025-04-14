import { Suspense } from 'react'
import DocContent from '@/components/docs/DocContent'

export default function DocsPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none px-8">
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      }>
        <DocContent />
      </Suspense>
    </div>
  )
}