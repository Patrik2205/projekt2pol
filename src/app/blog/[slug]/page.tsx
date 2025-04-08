'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
// Import the Markdown processing libraries
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css' // Import a syntax highlighting theme

type PostType = 'blogPost' | 'newRelease'

type Post = {
  id: number
  title: string
  content: string
  postType: PostType
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  isPublished: boolean
  slug: string
  author: {
    username: string
  }
}

// Function to convert markdown to HTML - identical to documentation implementation
async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, {
      allowDangerousHtml: true
    })
    .use(rehypeRaw)
    .use(rehypeHighlight)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}

export default function BlogPost() {
  const params = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [htmlContent, setHtmlContent] = useState<string>('')
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
        
        const response = await fetch(`/api/posts/${params.slug}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setPost(data)
        
        // Process markdown content after fetching the post
        if (data.content) {
          try {
            const processedContent = await markdownToHtml(data.content)
            setHtmlContent(processedContent)
          } catch (err) {
            console.error('Error processing markdown:', err)
            setHtmlContent('<p>Error processing content</p>')
          }
        }
      } catch (error) {
        console.error('Error fetching post:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch post')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [params.slug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {error || 'Post not found'}
            </h1>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Post Image */}
          <div className="w-full h-[400px] bg-gray-200 dark:bg-gray-700 overflow-hidden mb-8 rounded-bl-lg rounded-br-lg">
            <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
          </div>

          {/* Post Title */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {post.title}
          </h1>

          {/* Post Metadata */}
          <div className="flex flex-wrap gap-x-6 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <p>By {post.author.username}</p>
            <p>Published: {new Date(post.createdAt).toLocaleDateString()}</p>
            {post.updatedAt !== post.createdAt && (
              <p>Last edited: {new Date(post.updatedAt).toLocaleDateString()}</p>
            )}
          </div>

          {/* Post Content - now with Markdown rendering */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none markdown-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>
      </main>

      <Footer />
    </div>
  )
}