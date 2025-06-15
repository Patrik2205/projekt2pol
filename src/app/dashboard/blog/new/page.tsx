'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BlogPostEditor from '@/components/admin/BlogPostEditor'

export default function NewBlogPostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/user/info')
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        if (data.isAdmin) {
          setAllowed(true)
        } else {
          router.replace('/dashboard')
        }
      } catch {
        router.replace('/dashboard')
      }
    }

    if (status === 'authenticated') {
      checkAdmin()
    } else if (status === 'unauthenticated') {
      router.replace('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading' || !allowed) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-24">
        <div className="max-w-4xl mx-auto px-4">
          <BlogPostEditor onSuccess={() => router.push('/blog')} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

