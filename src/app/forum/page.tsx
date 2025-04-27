'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/forum/ForumSearch'
import ForumPostCreation from '@/components/forum/ForumPostCreation'
import ForumPostList from '@/components/forum/ForumPostList'

export default function ForumPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchTags, setSearchTags] = useState<number[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSearch = (query: string, tags: number[]) => {
    setSearchQuery(query)
    setSearchTags(tags)
  }

  const handlePostCreated = () => {
    // Trigger a refresh of the post list when a new post is created
    setRefreshTrigger(prev => prev + 1)
    // Reset search
    setSearchQuery('')
    setSearchTags([])
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Forum</h1>

          <div className="mb-6">
            <ForumSearch onSearch={handleSearch} />
          </div>

          <div className="mb-8">
            <ForumPostCreation onPostCreated={handlePostCreated} />
          </div>

          <section>
            <h2 className="text-2xl font-bold mb-4">Forum Posts</h2>
            <ForumPostList 
              key={refreshTrigger} 
              searchQuery={searchQuery} 
              searchTags={searchTags} 
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}