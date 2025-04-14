'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-black/[.1] dark:border-white/[.1]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          <div className="w-48">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.svg" alt="Logo" width={40} height={40} />
              <span className="text-xl font-bold">VašeAplikace</span>
            </Link>
          </div>

          <div className="flex-1 hidden md:flex items-center justify-center space-x-8">
            <Link href="/features" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">
              Features
            </Link>
            <Link href="/blog" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">
              Blog
            </Link>
            <Link 
              href="/docs" 
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </Link>
            <Link href="/download" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">
              Download
            </Link>
          </div>

          <div className="flex gap-2 justify-end">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
} 