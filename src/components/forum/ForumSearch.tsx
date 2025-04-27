'use client'

import { useState, useEffect, useRef } from 'react'

type Tag = {
  id: number
  name: string
  slug: string
}

type ForumSearchProps = {
  onSearch: (query: string, tags: number[]) => void
}

export default function ForumSearch({ onSearch }: ForumSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const tagDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch available tags
    const fetchTags = async () => {
      try {
        setIsLoading(true)
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
        setIsLoading(false)
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

  const handleSearch = () => {
    onSearch(searchQuery, selectedTags.map(tag => tag.id))
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

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="post-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Posts
          </label>
          <input
            type="text"
            id="post-search"
            placeholder="Search post titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          />
        </div>

        <div className="relative" ref={tagDropdownRef}>
          <label htmlFor="tag-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filter by Tags
          </label>
          <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-2 min-h-10">
            {selectedTags.map(tag => (
              <div 
                key={tag.id}
                className="flex items-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-md"
              >
                <span>{tag.name}</span>
                <button 
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                >
                  &times;
                </button>
              </div>
            ))}
            <input
              type="text"
              id="tag-search"
              placeholder={selectedTags.length > 0 ? "Add more tags..." : "Add tags..."}
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              onFocus={() => setIsTagDropdownOpen(true)}
              className="flex-grow min-w-[100px] border-none focus:ring-0 outline-none bg-transparent"
            />
          </div>

          {isTagDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-300 dark:border-gray-600 max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
                  Loading tags...
                </div>
              ) : filteredTags.length > 0 ? (
                filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
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
          onClick={handleSearch}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Search
        </button>
      </div>
    </div>
  )
}