'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DashboardSidebar from '@/components/DashboardSidebar'
import DocSectionEditor from '@/components/admin/DocSectionEditor'

export default function NewDocSectionPage() {
  const { status } = useSession()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/user/info')
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        if (data.isAdmin) {
          setIsAdmin(true)
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

  if (status === 'loading' || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex pt-16">
        <DashboardSidebar
          activeSection="create-docs"
          onSectionChange={() => {}}
          isAdmin
        />
        <main className="flex-grow p-8">
          <div className="max-w-4xl mx-auto">
            <DocSectionEditor onSuccess={() => router.push('/docs')} />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

