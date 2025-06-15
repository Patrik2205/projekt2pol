'use client'

import { useEffect, useRef, useState } from 'react'

export type Tag = {
  id: number
  name: string
  slug: string
}

type TagSelectorProps = {
  selectedTags: Tag[]
  onChange: (tags: Tag[]) => void
  disabled?: boolean
}

export default function TagSelector({ selectedTags, onChange, disabled = false }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoadingTags(true)
        const res = await fetch('/api/tags')
        if (res.ok) {
          const data = await res.json()
          setAvailableTags(data)
        } else {
          setAvailableTags([])
        }
      } catch {
        setAvailableTags([])
      } finally {
        setIsLoadingTags(false)
      }
    }

    fetchTags()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddTag = (tag: Tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      onChange([...selectedTags, tag])
    }
    setTagSearchQuery('')
  }

  const handleRemoveTag = (id: number) => {
    onChange(selectedTags.filter(tag => tag.id !== id))
  }

  const filteredTags = availableTags.filter(
    tag =>
      tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
      !selectedTags.some(t => t.id === tag.id)
  )

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor="blog-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Tags
      </label>
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 mb-1 min-h-10">
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
              disabled={disabled}
            >
              &times;
            </button>
          </div>
        ))}
        <input
          type="text"
          id="blog-tags"
          placeholder={selectedTags.length > 0 ? 'Add more tags...' : 'Add tags...'}
          value={tagSearchQuery}
          onChange={e => setTagSearchQuery(e.target.value)}
          onFocus={() => setIsTagDropdownOpen(true)}
          className="flex-grow min-w-[100px] border-none focus:ring-0 outline-none bg-transparent"
          disabled={disabled}
        />
      </div>
      {isTagDropdownOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-300 dark:border-gray-600 max-h-60 overflow-y-auto">
          {isLoadingTags ? (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">Loading tags...</div>
          ) : filteredTags.length > 0 ? (
            filteredTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={disabled}
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
  )
}
