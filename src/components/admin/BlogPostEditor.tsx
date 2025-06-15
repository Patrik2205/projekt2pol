'use client'

import { useState } from 'react'
import TagSelector, { Tag } from './TagSelector'

export default function BlogPostEditor({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<'blogPost' | 'newRelease'>('blogPost')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const tagIds = selectedTags.map(tag => tag.id)

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, postType, tags: tagIds })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create post')
      }

      setTitle('')
      setContent('')
      setSelectedTags([])
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error creating post:', err)
      setError(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Create Blog Post</h2>
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content (Markdown)
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Post Type
          </label>
          <select
            value={postType}
            onChange={e => setPostType(e.target.value as 'blogPost' | 'newRelease')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            disabled={isSubmitting}
          >
            <option value="blogPost">Blog Post</option>
            <option value="newRelease">New Release</option>
          </select>
        </div>
        <TagSelector
          selectedTags={selectedTags}
          onChange={setSelectedTags}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className={`w-full px-4 py-2 text-white rounded-md ${
            isSubmitting ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  )
}

