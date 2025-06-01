type DashboardSidebarProps = {
  activeSection: string
  onSectionChange: (section: string) => void
  isAdmin?: boolean
}

export default function DashboardSidebar({ 
  activeSection, 
  onSectionChange,
  isAdmin = false
}: DashboardSidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'posts', label: 'Posts', icon: '📝' },
    { id: 'comments', label: 'Comments', icon: '💬' },
    ...(isAdmin ? [{ id: 'software', label: 'Software', icon: '💾' }] : []),
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <nav className="p-4 space-y-2">
        {menuItems.map(item => (
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
        ))}
      </nav>
    </aside>
  )
}