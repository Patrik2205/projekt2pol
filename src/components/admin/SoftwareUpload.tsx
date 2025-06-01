'use client'

import { useState, useRef } from 'react'

type SoftwareUploadProps = {
  onUploadSuccess: () => void
}

export default function SoftwareUpload({ onUploadSuccess }: SoftwareUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  
  const [formData, setFormData] = useState({
    versionNumber: '',
    minRequirements: '',
    changelog: '',
    releasePostId: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileSelect = (file: File) => {
    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      setError('File size must be less than 500MB')
      return
    }

    const allowedTypes = ['.exe', '.msi', '.zip']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Only .exe, .msi, and .zip files are allowed')
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    if (!formData.versionNumber.trim()) {
      setError('Version number is required')
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('versionNumber', formData.versionNumber)
      uploadFormData.append('minRequirements', formData.minRequirements)
      uploadFormData.append('changelog', formData.changelog)
      uploadFormData.append('releasePostId', formData.releasePostId)

      const response = await fetch('/api/software/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      // Reset form
      setFormData({
        versionNumber: '',
        minRequirements: '',
        changelog: '',
        releasePostId: ''
      })
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onUploadSuccess()
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Upload New Software Version</h2>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Software File *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                : selectedFile
                ? 'border-green-500 bg-green-50 dark:bg-green-900'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div>
                <div className="text-green-600 dark:text-green-400 mb-2">
                  ✓ File Selected
                </div>
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="mt-2 text-red-600 hover:text-red-700 text-sm"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-lg font-medium">
                  Drop your file here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary-600 hover:text-primary-500"
                  >
                    browse
                  </button>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Supports: .exe, .msi, .zip files up to 500MB
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".exe,.msi,.zip"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Version Number */}
        <div>
          <label htmlFor="versionNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Version Number *
          </label>
          <input
            type="text"
            id="versionNumber"
            name="versionNumber"
            value={formData.versionNumber}
            onChange={handleInputChange}
            placeholder="e.g., 1.0.0, 2.1.3-beta"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isUploading}
          />
        </div>

        {/* System Requirements */}
        <div>
          <label htmlFor="minRequirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            System Requirements
          </label>
          <textarea
            id="minRequirements"
            name="minRequirements"
            value={formData.minRequirements}
            onChange={handleInputChange}
            rows={3}
            placeholder="e.g., Windows 10 or later, 4GB RAM, 2GB free disk space"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isUploading}
          />
        </div>

        {/* Changelog */}
        <div>
          <label htmlFor="changelog" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Changelog
          </label>
          <textarea
            id="changelog"
            name="changelog"
            value={formData.changelog}
            onChange={handleInputChange}
            rows={4}
            placeholder="What's new in this version..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isUploading}
          />
        </div>

        {/* Release Post ID */}
        <div>
          <label htmlFor="releasePostId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Release Post ID (Optional)
          </label>
          <input
            type="number"
            id="releasePostId"
            name="releasePostId"
            value={formData.releasePostId}
            onChange={handleInputChange}
            placeholder="Link to a blog post about this release"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isUploading}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Uploading to S3...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className={`w-full py-3 px-4 rounded-md font-medium ${
            isUploading || !selectedFile
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isUploading ? 'Uploading to S3...' : 'Upload Software Version'}
        </button>
      </form>
    </div>
  )
}