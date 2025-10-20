'use client'

import React, { useState, useCallback } from 'react'

interface DashboardSearchProps {
  onSearch: (searchTerm: string) => void
  value?: string
  placeholder?: string
  className?: string
}

export default function DashboardSearch({ 
  onSearch, 
  value,
  placeholder = "Search locations and assets...",
  className = ''
}: DashboardSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value || '')

  // Update local state when value prop changes
  React.useEffect(() => {
    if (value !== undefined) {
      setSearchTerm(value)
    }
  }, [value])

  const handleSearchChange = useCallback((inputValue: string) => {
    setSearchTerm(inputValue)
    // Don't trigger search on every keystroke anymore
  }, [])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm)
    }
  }, [onSearch, searchTerm])

  const handleClear = useCallback(() => {
    setSearchTerm('')
    onSearch('')
  }, [onSearch])

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full max-w-[350px] text-[14px] pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-gray-400 bg-white text-gray-900 placeholder-gray-500"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
