'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toastSuccess, toastError } from '@/components/ui/toast'
import VirtualizedAssetGrid from '@/components/VirtualizedAssetGrid'
import DashboardSearch from '@/components/DashboardSearch'

interface Location {
  id: number
  name: string
  _count?: {
    inventories: number
  }
}

interface Asset {
  id: number
  customer_id: number
  asset_id: number
  asset_name: string | null
  location_id: number
  location_name: string | null
  rfid: string | null
  purchase_date: string | null
  last_date: string | null
  ref_client: string | null
  status: string | null
  reg_date: string | null
  inv_date: string | null
  comment: string | null
}

// Function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }
    
    // Decode the payload (second part)
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch (error) {
    return null
  }
}

export default function AdminDashboard() {
  const [locations, setLocations] = useState<Location[]>([])
  const [newLocationName, setNewLocationName] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editLocationName, setEditLocationName] = useState('')


  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
        
      if (!token) {
        setLoading(false)
        return
      }
      
      const response = await fetch('/api/locations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      } else {
        // Handle error silently
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }



  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return

    try {
      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newLocationName.trim() }),
      })

      if (response.ok) {
        setNewLocationName('')
        fetchLocations()
        toastSuccess('Location added successfully!')
      } else {
        toastError('Failed to add location. Please try again.')
      }
    } catch (error) {
      toastError('Failed to add location. Please try again.')
    }
  }

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchLocations()
        toastSuccess('Location deleted successfully!')
      } else {
        toastError('Failed to delete location. Please try again.')
      }
    } catch (error) {
      toastError('Failed to delete location. Please try again.')
    }
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setEditLocationName(location.name)
  }

  const handleSaveEdit = async () => {
    if (!editingLocation || !editLocationName.trim()) return

    try {
      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
      const response = await fetch(`/api/locations/${editingLocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editLocationName.trim() }),
      })

      if (response.ok) {
        setEditingLocation(null)
        setEditLocationName('')
        fetchLocations()
        toastSuccess('Location updated successfully!')
      } else {
        toastError('Failed to update location. Please try again.')
      }
    } catch (error) {
      toastError('Failed to update location. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setEditingLocation(null)
    setEditLocationName('')
  }



  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col p-2 sm:p-3 md:p-4 lg:p-6">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex-shrink-0">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">         
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col h-full">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex-shrink-0">Location</h2>
            
            {/* Add new location */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4 flex-shrink-0">
              <div className="relative flex-1">
                <img 
                  src="/location.svg" 
                  alt="Location" 
                  className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none opacity-40" 
                />
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Input new location"
                  className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                />
              </div>
              <button
                onClick={handleAddLocation}
                disabled={!newLocationName.trim()}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Location list */}
            <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <img 
                    src="/6-dots-spinner.svg" 
                    alt="Loading..." 
                    className="w-8 h-8 sm:w-10 sm:h-10 opacity-60"
                  />
                </div>
              ) : !localStorage.getItem('auth-token') && !document.cookie.includes('auth-token=') ? (
                <div className="text-gray-500 text-center py-4 text-sm">Please log in to view locations</div>
              ) : locations.length === 0 ? (
                <div className="text-gray-500 text-center py-4 text-sm">No locations found</div>
              ) : (
                locations.map((location) => (
                  <div
                    key={location.id}
                    className={`border rounded-lg transition-colors ${
                      selectedLocationId === location.id 
                        ? 'bg-yellow-100 border-yellow-300' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {editingLocation?.id === location.id ? (
                      // Edit mode
                      <div className="p-2 sm:px-3 sm:py-2">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={editLocationName}
                            onChange={(e) => setEditLocationName(e.target.value)}
                            placeholder="Barcode"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={!editLocationName.trim()}
                              className="flex-1 sm:flex-none px-3 py-1 bg-green-500 text-white text-xs sm:text-sm rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 sm:flex-none px-3 py-1 bg-gray-500 text-white text-xs sm:text-sm rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Normal mode
                      <div
                        onClick={() => setSelectedLocationId(location.id)}
                        className="flex items-center justify-between p-2 sm:px-3 sm:py-2 cursor-pointer"
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{location.name}</div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <span className="text-xs sm:text-sm text-gray-700 px-1 sm:px-2 py-1 bg-white border border-gray-200 rounded whitespace-nowrap">
                            {location._count?.inventories || 0}<span className="hidden xs:inline sm:inline"> assets</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditLocation(location)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edit location"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLocation(location.id)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete location"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>            
          </div>
        </div>
        <div className="flex flex-col min-h-0">          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col h-full">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 flex-shrink-0">
              Assets by location
              {selectedLocationId && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({locations.find(loc => loc.id === selectedLocationId)?.name})
                </span>
              )}
            </h2>
            <div className="flex-1 min-h-0">
              <VirtualizedAssetGrid selectedLocationId={selectedLocationId} />
            </div>            
          </div>
        </div>
      </div>  
    </div>
  )
}
