'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DashboardSidebar from '@/components/DashboardSidebar'
import SoftwareUpload from '@/components/admin/SoftwareUpload'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type UserStats = {
  totalPosts: number
  totalComments: number
  totalDownloads: number
}

type EditingField = 'username' | 'email' | 'firstName' | 'lastName' | 'password' | null

type SoftwareVersion = {
  id: number
  versionNumber: string
  sizeBytes: string | number
  releaseDate: string
  isLatest: boolean
  changelog?: string
  downloadUrl: string
  downloadCount?: number
}

type DownloadStats = {
  totalDownloads: number
  downloadsThisMonth: number
  downloadsThisWeek: number
  downloadsToday: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [editingField, setEditingField] = useState<EditingField>(null)
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: ''
  })
  const [userPosts, setUserPosts] = useState<Array<{
    id: number
    title: string
    createdAt: string
    updatedAt: string
    slug: string
  }>>([])

  // Software management state
  const [softwareVersions, setSoftwareVersions] = useState<SoftwareVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [downloadStats, setDownloadStats] = useState<DownloadStats | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data)
    }

    if (session?.user) {
      fetchStats()
    }
  }, [session])

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/info')
        if (response.ok) {
          const data = await response.json()
          setUserInfo(data)
          setIsAdmin(data.isAdmin)
        } else {
          console.error('Failed to fetch user info')
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    if (session?.user) {
      fetchUserInfo()
    }
  }, [session])

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await fetch('/api/posts/user')
        console.log('Response status:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('Fetched posts:', data)
          setUserPosts(data)
        }
      } catch (error) {
        console.error('Error fetching user posts:', error)
      }
    }

    if (session?.user) {
      console.log('Fetching posts for session user:', session.user)
      fetchUserPosts()
    }
  }, [session])

  // Software management useEffect
  useEffect(() => {
    if (session?.user && activeSection === 'software' && isAdmin) {
      fetchVersions()
      fetchDownloadStats()
    }
  }, [session, activeSection, isAdmin])

  // Software management functions
  const fetchVersions = async () => {
    try {
      setVersionsLoading(true)
      const response = await fetch('/api/software')
      if (response.ok) {
        const data = await response.json()
        setSoftwareVersions(data)
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setVersionsLoading(false)
    }
  }

  const fetchDownloadStats = async () => {
    try {
      const response = await fetch('/api/software/stats')
      if (response.ok) {
        const data = await response.json()
        setDownloadStats(data)
      }
    } catch (error) {
      console.error('Error fetching download stats:', error)
    }
  }

  const setVersionAsLatest = async (versionId: number) => {
    try {
      const response = await fetch(`/api/software/${versionId}/set-latest`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchVersions()
      }
    } catch (error) {
      console.error('Error setting version as latest:', error)
    }
  }

  const deleteVersion = async (versionId: number) => {
    if (!confirm('Are you sure you want to delete this version? This will also delete the file from S3. This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/software/${versionId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchVersions()
        fetchDownloadStats() // Refresh stats after deletion
      }
    } catch (error) {
      console.error('Error deleting version:', error)
    }
  }

  const downloadVersion = async (version: SoftwareVersion) => {
    try {
      // Use the same download API that the public download page uses
      const response = await fetch('/api/software/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ versionId: version.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate download');
      }
      
      const data = await response.json();
      
      if (data.downloadUrl) {
        // Open the download URL in a new tab
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName || `${version.versionNumber}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success notification
        console.log(`Download started: ${data.fileName}`);
      } else {
        throw new Error('No download URL received');
      }
      
    } catch (error) {
      console.error('Error downloading version:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Please try again later.'}`);
    }
  }
  const formatFileSize = (bytes: string | number) => {
    const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes
    if (numBytes < 1024) return `${numBytes} B`
    if (numBytes < 1024 * 1024) return `${(numBytes / 1024).toFixed(2)} KB`
    if (numBytes < 1024 * 1024 * 1024) return `${(numBytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(numBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex pt-16">
        <DashboardSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          isAdmin={isAdmin}
        />
        
        <main className="flex-grow p-8">
          <div className="max-w-3xl mx-auto">
            {activeSection === 'overview' && (
              <>
                <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Your Posts
                    </h3>
                    <p className="text-3xl font-bold text-primary-600">
                      {stats?.totalPosts || 0}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Your Comments
                    </h3>
                    <p className="text-3xl font-bold text-primary-600">
                      {stats?.totalComments || 0}
                    </p>
                  </div>
                </div>

                <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    No recent activity
                  </p>
                </section>
              </>
            )}

            {activeSection === 'posts' && (
              <>
                <h1 className="text-3xl font-bold mb-8">Your Posts</h1>
                
                <div className="space-y-8">
                  {isAdmin && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h2 className="text-2xl font-bold mb-4">Your Blog Posts</h2>
                      {userPosts.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {userPosts.map(post => (
                            <Link 
                              key={post.id}
                              href={`/blog/${post.slug}`}
                              className="block py-4 px-6 my-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {post.title}
                              </h3>
                              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p>Created: {new Date(post.createdAt).toLocaleString()}</p>
                                {post.updatedAt !== post.createdAt && (
                                  <p>Last edited: {new Date(post.updatedAt).toLocaleString()}</p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400">
                          You haven't created any blog posts yet.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">Your Forum Posts</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Coming soon: Forum functionality will be added in the future
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'comments' && (
              <>
                <h1 className="text-3xl font-bold mb-8">Comments</h1>
                
                <div className="space-y-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">Your Comments</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Coming soon: View and manage your comments across the platform
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">Comments on Your Posts</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Coming soon: View and manage comments on your posts
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'software' && isAdmin && (
              <>
                <h1 className="text-3xl font-bold mb-8">Software Management</h1>
                
                <div className="space-y-8">
                  {/* Upload New Version */}
                  <SoftwareUpload 
                    onUploadSuccess={() => {
                      fetchVersions()
                      fetchDownloadStats()
                    }} 
                  />

                  {/* Existing Versions */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Existing Versions</h2>
                      <button
                        onClick={fetchVersions}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                      >
                        Refresh
                      </button>
                    </div>

                    {versionsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    ) : softwareVersions.length > 0 ? (
                      <div className="space-y-4">
                        {softwareVersions.map((version) => (
                          <div key={version.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">Version {version.versionNumber}</h3>
                                  {version.isLatest && (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs font-medium rounded-full">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <div>
                                    <span className="font-medium">Size:</span> {formatFileSize(version.sizeBytes)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Released:</span> {formatDate(version.releaseDate)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Storage:</span> AWS S3
                                  </div>
                                </div>
                                {version.changelog && (
                                  <div className="mt-2">
                                    <span className="font-medium text-sm">Changelog:</span>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{version.changelog}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                {!version.isLatest && (
                                  <button
                                    onClick={() => setVersionAsLatest(version.id)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  >
                                    Set as Latest
                                  </button>
                                )}
                                <button
                                  onClick={() => downloadVersion(version)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Download
                                </button>
                                <button
                                  onClick={() => deleteVersion(version.id)}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">No software versions uploaded yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Download Statistics */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-6">Download Statistics</h2>
                    
                    {downloadStats ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary-600">{downloadStats.totalDownloads}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">{downloadStats.downloadsThisMonth}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{downloadStats.downloadsThisWeek}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600">{downloadStats.downloadsToday}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold mb-8 text-center">Settings</h1>
                
                {editingField && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
                      <h2 className="text-xl font-bold mb-4">
                        Edit {editingField.charAt(0).toUpperCase() + editingField.slice(1)}
                      </h2>
                      <form className="space-y-4">
                        <input
                          type={editingField === 'email' ? 'email' : 'text'}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                          placeholder={`Enter new ${editingField}`}
                        />
                        {editingField === 'password' && (
                          <>
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                              placeholder="Current password"
                            />
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                              placeholder="Confirm new password"
                            />
                          </>
                        )}
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingField(null)}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                        <p className="text-lg font-medium truncate">{userInfo.username || 'Not set'}</p>
                      </div>
                      <button
                        onClick={() => setEditingField('username')}
                        className="ml-4 px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex-shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-lg font-medium truncate">{userInfo.email || 'Not set'}</p>
                      </div>
                      <button
                        onClick={() => setEditingField('email')}
                        className="ml-4 px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex-shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <p className="text-sm text-gray-500 dark:text-gray-400">First Name</p>
                        <p className="text-lg font-medium truncate">{userInfo.firstName || 'Not set'}</p>
                      </div>
                      <button
                        onClick={() => setEditingField('firstName')}
                        className="ml-4 px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex-shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Name</p>
                        <p className="text-lg font-medium truncate">{userInfo.lastName || 'Not set'}</p>
                      </div>
                      <button
                        onClick={() => setEditingField('lastName')}
                        className="ml-4 px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex-shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Password</p>
                        <p className="text-lg font-medium">••••••••</p>
                      </div>
                      <button
                        onClick={() => setEditingField('password')}
                        className="ml-4 px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex-shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}