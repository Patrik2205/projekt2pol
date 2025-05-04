'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import ForumComments from '@/components/forum/ForumComments'

type ForumPost = {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
  views: number
  author: {
    username: string
  }
  tags: Array<{
    tag: {
      id: number
      name: string
      slug: string
    }
  }>
}

export default function ForumPostPage() {
  const params = useParams()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!params.slug || typeof params.slug !== 'string') {
          throw new Error('Invalid slug parameter')
        }

        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/forum/posts/${params.slug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Post not found')
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setPost(data)
      } catch (error) {
        console.error('Error fetching post:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch post')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [params.slug])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link 
              href="/forum"
              className="text-primary-600 hover:text-primary-700 flex items-center"
            >
              ← Back to Forum
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-6 rounded-lg text-center">
              <h2 className="text-xl font-bold mb-2">Error</h2>
              <p>{error}</p>
            </div>
          ) : post ? (
            <>
              <article className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-8">
                <div className="p-6">
                  <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                  
                  <div className="flex flex-wrap justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span>Posted by {post.author.username}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(post.createdAt)}</span>
                      {post.updatedAt !== post.createdAt && (
                        <span className="ml-2">(Edited: {formatDate(post.updatedAt)})</span>
                      )}
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span>Views: {post.views}</span>
                    </div>
                  </div>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {post.tags.map(({ tag }) => (
                        <span 
                          key={tag.id} 
                          className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-md text-sm"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="prose prose-lg dark:prose-invert max-w-none mt-6">
                    <p className="whitespace-pre-line">{post.content}</p>
                  </div>
                </div>
              </article>

              {/* Comments Section - pass the post ID to the comments component */}
              {post.id && <ForumComments forumPostId={post.id} />}
            </>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400">Post not found</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}