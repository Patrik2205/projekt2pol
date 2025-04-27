'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

type Tag = {
  id: number
  name: string
  slug: string
}

type ForumPostCreationProps = {
  onPostCreated: () => void
}

export default function ForumPostCreation({ onPostCreated }: ForumPostCreationProps) {
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch available tags
    const fetchTags = async () => {
      try {
        setIsLoadingTags(true)
        const response = await fetch('/api/forum/tags')
        
        if (!response.ok) {
          throw new Error('Failed to load tags')
        }
        
        const data = await response.json()
        setAvailableTags(data)
      } catch (error) {
        console.error('Error fetching tags:', error)
        // Fallback to empty list
        setAvailableTags([])
      } finally {
        setIsLoadingTags(false)
      }
    }

    fetchTags()
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      setError('You must be logged in to create a post')
      return
    }

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!content.trim()) {
      setError('Content is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          tags: selectedTags.map(tag => tag.id)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      // Reset form
      setTitle('')
      setContent('')
      setSelectedTags([])
      setTagSearchQuery('')
      
      // Notify parent component
      onPostCreated()
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = (tag: Tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag])
    }
    setTagSearchQuery('')
  }

  const handleRemoveTag = (tagId: number) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId))
  }

  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
    !selectedTags.some(t => t.id === tag.id)
  )

  if (!session) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Please sign in to create a forum post.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="Enter post title"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="post-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content
          </label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md h-32"
            placeholder="Enter post content"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="relative" ref={tagDropdownRef}>
          <label htmlFor="post-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-2 min-h-10">
            {selectedTags.map(tag => (
              <div 
                key={tag.id}
                className="flex items-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-md"
              >
                <span>{tag.name}</span>
                <button 
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                  disabled={isSubmitting}
                >
                  &times;
                </button>
              </div>
            ))}
            <input
              type="text"
              id="post-tags"
              placeholder={selectedTags.length > 0 ? "Add more tags..." : "Add tags..."}
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              onFocus={() => setIsTagDropdownOpen(true)}
              className="flex-grow min-w-[100px] border-none focus:ring-0 outline-none bg-transparent"
              disabled={isSubmitting}
            />
          </div>

          {isTagDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-300 dark:border-gray-600 max-h-60 overflow-y-auto">
              {isLoadingTags ? (
                <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
                  Loading tags...
                </div>
              ) : filteredTags.length > 0 ? (
                filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={isSubmitting}
                  >
                    {tag.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
                  {tagSearchQuery ? 'No matching tags found' : 'No tags available'}
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          className={`w-full px-4 py-2 text-white rounded-md ${
            isSubmitting 
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Post...' : 'Create Post'}
        </button>
      </form>
    </div>
  )
}