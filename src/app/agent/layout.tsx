'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import SecurityGuard from '@/components/auth/SecurityGuard'
import Sidebar from '@/components/ui/Sidebar'
import Image from 'next/image'
import { ClientNameProvider } from '@/contexts/ClientNameContext'

interface AgentLayoutProps {
  children: ReactNode
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  const { user, logout } = useAuth('agent')
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const sidebarRef = useRef<{ toggle: () => void }>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
  }

  return (
    <SecurityGuard requiredRole="agent">
      <ClientNameProvider>
        <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <Sidebar 
            ref={sidebarRef}
            role="agent"
            currentPath={pathname}
            onLogout={logout}
            username={user?.username}
          />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Header with Search and User Dropdown */}
          <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-5 flex items-center justify-between h-[73px]">
            <div className="flex items-center flex-1">
              {/* Sidebar Toggle Button */}
              <button
                onClick={() => sidebarRef.current?.toggle()}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors mr-3"
                title="Toggle Sidebar"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            {/* Desktop User Dropdown - Hidden on small screens */}
            <div className="hidden lg:block relative" ref={dropdownRef}>
              <button 
                className="flex items-center space-x-2 border border-gray-200 bg-gray-100 px-4 py-1 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-200 hover:border-gray-300 focus:outline-none transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Image src="/user.svg" alt="user" width={24} height={24} />
                <span className="text-sm font-medium uppercase">AGENT</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 px-1 z-50 border border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Logout Button - Visible only on small screens */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Log Out"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </header>


          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-100">
            {children}
          </main>
        </div>
      </div>
      </ClientNameProvider>
    </SecurityGuard>
  )
}
