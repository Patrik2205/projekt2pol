'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DashboardSidebar from '@/components/DashboardSidebar'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type UserStats = {
  totalPosts: number
  totalComments: number
  totalDownloads: number
}

type EditingField = 'username' | 'email' | 'firstName' | 'lastName' | 'password' | null

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