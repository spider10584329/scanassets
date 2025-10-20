'use client'

import { useState, useEffect } from 'react'
import { toastSuccess, toastError } from '@/components/ui/toast'
import { useClientName } from '@/hooks/useClientName'

interface UpdateDialogProps {
  isOpen: boolean
  onClose: () => void
  currentTitle: string
  onTitleUpdate: (newTitle: string) => void
}

export default function UpdateDialog({ 
  isOpen, 
  onClose, 
  currentTitle, 
  onTitleUpdate 
}: UpdateDialogProps) {
  const [title, setTitle] = useState(currentTitle)
  const [clientName, setClientName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { clientName: currentClientName, refreshClientName } = useClientName()

  // Initialize with current values when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle)
      setClientName(currentClientName.toLowerCase())
    }
  }, [isOpen, currentTitle, currentClientName])

  const handleSave = async () => {
    if (!title.trim() || !clientName.trim()) {
      toastError('Both title and client name are required')
      return
    }

    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      if (!token) {
        toastError('Authentication required')
        return
      }

      // Update client name via API
      const response = await fetch('/api/client', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clientname: clientName.trim() })
      })

      if (response.ok) {
        // Update title locally
        onTitleUpdate(title.trim())
        // Refresh client name in the hook
        refreshClientName()
        toastSuccess('Settings updated successfully!')
        onClose()
      } else {
        const data = await response.json()
        toastError(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toastError('Failed to update settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setTitle(currentTitle)
    setClientName(currentClientName.toLowerCase())
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Update Settings</h2>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Dashboard Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter dashboard title"
            />
          </div>
          
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
              Client Name
            </label>
            <input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter client name"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will appear in the sidebar and throughout the application
            </p>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !title.trim() || !clientName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading && (
              <img 
                src="/6-dots-spinner.svg" 
                alt="Loading..." 
                className="w-4 h-4 mr-2"
              />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
