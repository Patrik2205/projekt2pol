'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type SearchResult = {
  id: number
  title: string
  slug: string
}

export default function DocsHeader() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const router = useRouter()

  useEffect(() => {
    const searchDocs = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      try {
        const response = await fetch(`/api/docs/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setSearchResults(data)
      } catch (error) {
        console.error('Error searching docs:', error)
      }
    }

    const debounceTimer = setTimeout(searchDocs, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentation</h1>
          
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(`/docs?section=${result.slug}`)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {result.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}