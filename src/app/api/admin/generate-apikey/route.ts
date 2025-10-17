import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authentication token provided' },
        { status: 401 }
      )
    }

    // Verify token and check if user is admin
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Use customer_id from the verified token (ignore any request body)
    const customerId = payload.customerId

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID not found in token' },
        { status: 400 }
      )
    }

    // Generate a new API key
    const apiKey = uuidv4()

    try {
      // Check if a key already exists for this customer_id
      const existingKey = await prisma.$queryRaw<Array<{api_key: string}>>`
        SELECT api_key FROM apikey WHERE customer_id = ${customerId} LIMIT 1
      `

      if (existingKey.length > 0) {
        // Update existing key with new key
        await prisma.$executeRaw`
          UPDATE apikey SET api_key = ${apiKey}, created_at = NOW() 
          WHERE customer_id = ${customerId}
        `
      } else {
        // Insert new key record
        await prisma.$executeRaw`
          INSERT INTO apikey (customer_id, api_key, created_at) 
          VALUES (${customerId}, ${apiKey}, NOW())
        `
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { success: false, message: 'Database operation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      apiKey: apiKey
    })

  } catch (error) {
    console.error('Generate API key error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
