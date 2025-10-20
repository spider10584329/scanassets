'use client'

import { useState, useEffect, useCallback } from 'react'
import { useClientNameContext } from '@/contexts/ClientNameContext'

export function useClientName() {
  const [clientName, setClientName] = useState<string>('SCANASSETS')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { registerRefreshCallback, unregisterRefreshCallback } = useClientNameContext()

  const fetchClientName = useCallback(async () => {
    const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
    
    if (!token) {
      setClientName('SCANASSETS')
      setIsLoading(false)
      return
    }
    
    try {
      // Add cache busting to ensure we get fresh data
      const response = await fetch(`/api/client?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })       
      
      const data = await response.json()
      if (data.success) {
        const newClientName = data.clientname || 'SCANASSETS'
        setClientName(newClientName)
        console.log('Client name updated to:', newClientName) // Debug log
      } else {
        setClientName('SCANASSETS')
      }
    } catch (error) {
      console.error('Error fetching client name:', error)
      setClientName('SCANASSETS')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshClientName = useCallback(() => {
    console.log('Refreshing client name...') // Debug log
    setIsLoading(true)
    fetchClientName()
  }, [fetchClientName])

  useEffect(() => {
    fetchClientName()
    registerRefreshCallback(refreshClientName)
    
    return () => {
      unregisterRefreshCallback(refreshClientName)
    }
  }, [fetchClientName, registerRefreshCallback, unregisterRefreshCallback, refreshClientName])

  return {
    clientName: clientName.toUpperCase(), // Always display in uppercase
    isLoading,
    refreshClientName
  }
}
