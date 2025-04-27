'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type ForumPost = {
  id: number
  title: string
  authorId: number
  author: {
    username: string
  }
  createdAt: string
  views: number
  tags: Array<{
    tag: {
      id: number
      name: string
      slug: string
    }
  }>
  slug: string
}

type ForumPostListProps = {
  searchQuery?: string
  searchTags?: number[]
}

export default function ForumPostList({ searchQuery = '', searchTags = [] }: ForumPostListProps) {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const limit = 10 // Posts per page

  useEffect(() => {
    // Reset when search changes
    setPage(1)
    setHasMore(true)
    setPosts([])
    fetchPosts(1)
  }, [searchQuery, searchTags])

  const fetchPosts = async (newPage: number) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('q', searchQuery)
      }
      if (searchTags && searchTags.length > 0) {
        params.append('tags', searchTags.join(','))
      }
      params.append('page', String(newPage))
      params.append('limit', String(limit))
      
      const response = await fetch(`/api/forum/posts?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Error fetching posts: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Check if we've reached the end
      if (!Array.isArray(data) || data.length < limit) {
        setHasMore(false)
      }
      
      if (newPage === 1) {
        setPosts(data)
      } else {
        setPosts(prev => [...prev, ...data])
      }
    } catch (error) {
      console.error('Error fetching forum posts:', error)
      setError(error instanceof Error ? error.message : 'Failed to load posts')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md">
        <p>{error}</p>
        <button 
          onClick={() => fetchPosts(1)}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isLoading && page === 1 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">No posts found. Be the first to start a discussion!</p>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <Link href={`/forum/${post.slug}`} key={post.id} className="block">
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                
                <div className="flex flex-wrap justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>Posted by {post.author.username}</span>
                    <span>•</span>
                    <span>{formatDate(post.createdAt)}</span>
                    <span>•</span>
                    <span>{post.views} {post.views === 1 ? 'view' : 'views'}</span>
                  </div>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      {post.tags.map(({ tag }) => (
                        <span 
                          key={tag.id} 
                          className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-md text-xs"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
          
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className={`px-6 py-2 rounded-md ${
                  isLoading 
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}