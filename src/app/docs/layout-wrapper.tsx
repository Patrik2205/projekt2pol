import { Suspense } from 'react'
import DocsHeader from '@/components/docs/DocsHeader'

// This would be a simple wrapper for the DocsHeader to handle Suspense separately
export default function DocsHeaderWrapper() {
  return (
    <Suspense fallback={
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentation</h1>
            <div className="w-96 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </header>
    }>
      <DocsHeader />
    </Suspense>
  )
}