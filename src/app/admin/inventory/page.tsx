'use client'

import VirtualizedAssetGrid from '@/components/VirtualizedAssetGrid'

export default function AdminInventoryPage() {
  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col p-2 sm:p-3 md:p-4 lg:p-6">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex-shrink-0">Inventory Management</h1>
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col h-full">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 flex-shrink-0">All Assets</h2>
        <div className="flex-1 min-h-0">
          <VirtualizedAssetGrid selectedLocationId={null} />
        </div>
      </div>
    </div>
  )
}
