'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

type PostType = 'all' | 'updates' | 'other'
type Post = {
  id: number
  title: string
  content: string
  postType: 'blogPost' | 'newRelease'
  createdAt: string
  author: {
    username: string
  }
  slug: string
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filter, setFilter] = useState<PostType>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const postsPerPage = 5

  const fetchPosts = async () => {
    try {
      const postType = filter === 'updates' ? 'newRelease' : filter === 'other' ? 'blogPost' : ''
                      
      const response = await fetch(`/api/posts?type=${postType}&page=${page}&limit=${postsPerPage}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      
      const data = await response.json()
      
      const postsData = Array.isArray(data) ? data : []
      
      if (postsData.length < postsPerPage) {
        setHasMore(false)
      }
      
      if (page === 1) {
        setPosts(postsData)
      } else {
        setPosts(prev => [...prev, ...postsData])
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    }
  }

  useEffect(() => {
    setPage(1)
    setHasMore(true)
    fetchPosts()
  }, [filter])

  useEffect(() => {
    if (page > 1) {
      fetchPosts()
    }
  }, [page])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('updates')}
              className={`px-4 py-2 rounded-md ${
                filter === 'updates'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Updates
            </button>
            <button
              onClick={() => setFilter('other')}
              className={`px-4 py-2 rounded-md ${
                filter === 'other'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Other
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {posts.map(post => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block"
            >
              <div className="flex bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
                </div>

                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      By {post.author.username} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="self-start text-primary-600 hover:text-primary-500">
                    Read more →
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {hasMore && (
            <div className="text-center py-6">
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
} 