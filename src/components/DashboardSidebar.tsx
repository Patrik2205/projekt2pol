import Link from 'next/link'

type DashboardSidebarProps = {
  activeSection: string
  onSectionChange: (section: string) => void
  isAdmin?: boolean
}

type MenuItem = {
  id: string
  label: string
  icon: string
  href?: string
}

export default function DashboardSidebar({ 
  activeSection, 
  onSectionChange,
  isAdmin = false
}: DashboardSidebarProps) {
  const menuItems: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'posts', label: 'Posts', icon: '📝' },
    { id: 'comments', label: 'Comments', icon: '💬' },
    ...(isAdmin
      ? [
          { id: 'software', label: 'Software', icon: '💾' },
          { id: 'blog-admin', label: 'Blog Admin', icon: '📝', href: '/dashboard/blog/new' },
          { id: 'docs-admin', label: 'Docs Admin', icon: '📚', href: '/dashboard/docs/new' }
        ]
      : []),
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <nav className="p-4 space-y-2">
        {menuItems.map(item => (
          item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className="w-full flex items-center space-x-3 px-4 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ) : (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${
                activeSection === item.id
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        ))}
      </nav>
    </aside>
  )
}