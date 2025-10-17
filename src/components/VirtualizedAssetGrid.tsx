'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

// Simple notification system to avoid circular dependencies
const showSuccess = (message: string) => {
  // For now, we'll use a simple method to avoid import issues
  if (typeof window !== 'undefined') {
    // Create a simple success notification
    const notification = document.createElement('div')
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `
    document.body.appendChild(notification)
    setTimeout(() => document.body.removeChild(notification), 3000)
  }
}

const showError = (message: string) => {
  // For now, we'll use a simple method to avoid import issues
  if (typeof window !== 'undefined') {
    // Create a simple error notification
    const notification = document.createElement('div')
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #EF4444;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `
    document.body.appendChild(notification)
    setTimeout(() => document.body.removeChild(notification), 3000)
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

interface VirtualizedAssetGridProps {
  selectedLocationId: number | null
}

const ITEMS_PER_PAGE = 20
// const ITEM_HEIGHT = 280 // Approximate height of each asset card
// const BUFFER_SIZE = 5 // Number of items to render outside viewport

export default function VirtualizedAssetGrid({ selectedLocationId }: VirtualizedAssetGridProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [totalAssets, setTotalAssets] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [editAssetName, setEditAssetName] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // Reset when location changes
  useEffect(() => {
    setAssets([])
    setPage(1)
    setHasMore(true)
    setTotalAssets(0)
    fetchAssets(1, true)
  }, [selectedLocationId])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loadingRef.current && hasMore && !loading) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
            loadMore()
          }
        },
        { threshold: 0.1 }
      )
      observerRef.current.observe(loadingRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, loadingMore])

  const fetchAssets = async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
        
      if (!token) {
        return
      }

      // Build URL with pagination and optional location filter
      let url = `/api/inventories?page=${pageNum}&limit=${ITEMS_PER_PAGE}`
      if (selectedLocationId) {
        url += `&location_id=${selectedLocationId}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const newAssets = data.inventories || []
        
        if (reset) {
          setAssets(newAssets)
        } else {
          setAssets(prev => [...prev, ...newAssets])
        }
        
        setTotalAssets(data.total || 0)
        setHasMore(newAssets.length === ITEMS_PER_PAGE && (reset ? newAssets.length : assets.length + newAssets.length) < (data.total || 0))
      } else {
        if (reset) setAssets([])
      }
    } catch {
      if (reset) setAssets([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchAssets(nextPage, false)
  }, [page, hasMore, loading, loadingMore, selectedLocationId])

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
    setEditAssetName(asset.asset_name || '')
  }

  const handleSaveAssetEdit = async () => {
    if (!editingAsset) return

    try {
      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
      
      // Update asset name only
      const response = await fetch(`/api/inventories/${editingAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          asset_name: editAssetName.trim() || null
        }),
      })

      if (response.ok) {
        setEditingAsset(null)
        setEditAssetName('')
        // Update the asset in the current list
        setAssets(prev => prev.map(asset => 
          asset.id === editingAsset.id 
            ? { ...asset, asset_name: editAssetName.trim() || null }
            : asset
        ))
        showSuccess('Asset name updated successfully!')
      } else {
        showError('Failed to update asset name. Please try again.')
      }
    } catch {
      showError('Failed to update asset. Please try again.')
    }
  }

  const handleCancelAssetEdit = () => {
    setEditingAsset(null)
    setEditAssetName('')
  }

  const handleDeleteAsset = async (id: number) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
      
      const response = await fetch(`/api/inventories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Remove asset from local state
        setAssets(prev => prev.filter(asset => asset.id !== id))
        setTotalAssets(prev => prev - 1)
        showSuccess('Asset deleted successfully!')
      } else {
        showError('Failed to delete asset. Please try again.')
      }
    } catch {
      showError('Failed to delete asset. Please try again.')
    }
  }

  if (loading && assets.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <img 
          src="/6-dots-spinner.svg" 
          alt="Loading..." 
          className="w-8 h-8 sm:w-10 sm:h-10 opacity-60"
        />
      </div>
    )
  }

  if (!selectedLocationId && assets.length === 0 && !loading) {
    return (
      <div className="text-gray-500 text-center py-4 text-sm">
        Select a location to view assets
      </div>
    )
  }

  if (selectedLocationId && assets.length === 0 && !loading) {
    return (
      <div className="text-gray-500 text-center py-4 text-sm">
        No assets found for this location
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      {/* Asset count info */}
      <div className="text-xs text-gray-500 mb-3 flex-shrink-0">
        Showing {assets.length} of {totalAssets} assets
      </div>
      
      {/* Assets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        {assets.map((asset, index) => (
          <div
            key={`${asset.id}-${index}`}
            className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors relative"
          >
            {/* Delete Button */}
            <button
              onClick={() => handleDeleteAsset(asset.id)}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 bg-white rounded-full shadow-sm border hover:border-red-200 hover:shadow-md transition-all z-10"
              title="Delete asset"
              style={{ pointerEvents: 'auto' }}
            >
              <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Asset Image */}
            <div className="aspect-square bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden">
              <img
                src={`${process.env.NEXT_PUBLIC_ORIGINAL_BACKEND_URL || 'http://localhost:3000'}/photo/assets/${asset.asset_id}.png`}
                alt={asset.asset_name || `Asset ${asset.asset_id}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // Fallback image or placeholder
                  const target = e.target as HTMLImageElement
                  target.src = '/file.svg'
                  target.className = 'w-full h-full object-contain p-8 opacity-30'
                }}
              />
            </div>
            
            {/* Asset Info */}
            <div className="space-y-2">
              {editingAsset?.id === asset.id ? (
                <div className="space-y-2">
                  {/* Asset Name Edit */}
                  <input
                    type="text"
                    value={editAssetName}
                    onChange={(e) => setEditAssetName(e.target.value)}
                    placeholder="Enter asset name"
                    className="w-full px-2 py-1 text-sm font-medium border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveAssetEdit()
                      if (e.key === 'Escape') handleCancelAssetEdit()
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveAssetEdit}
                      className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelAssetEdit}
                      className="flex-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div 
                    onClick={() => handleEditAsset(asset)}
                    className="font-medium text-gray-900 text-sm truncate cursor-pointer hover:bg-white hover:border hover:border-gray-400 rounded px-1 py-0.5 transition-all flex-1 mr-2"
                    title="Click to edit asset name"
                  >
                    {asset.asset_name || `Asset ${asset.asset_id}`}
                  </div>
                  <button
                    onClick={() => handleEditAsset(asset)}
                    className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    title="Edit asset name"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
              
              {asset.ref_client && (
                <div className="text-xs text-gray-500">
                  Ref: {asset.ref_client}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading more indicator */}
      {hasMore && (
        <div
          ref={loadingRef}
          className="flex justify-center items-center py-6 mt-4"
        >
          {loadingMore ? (
            <>
              <img 
                src="/6-dots-spinner.svg" 
                alt="Loading more..." 
                className="w-6 h-6 opacity-60 mr-2"
              />
              <span className="text-sm text-gray-500">Loading more assets...</span>
            </>
          ) : (
            <div className="h-6"></div>
          )}
        </div>
      )}

      {!hasMore && assets.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          All assets loaded ({totalAssets} total)
        </div>
      )}
    </div>
  )
}
