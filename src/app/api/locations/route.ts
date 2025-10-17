import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/jwt'

const prisma = new PrismaClient()

// GET - Fetch all locations
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded || !decoded.customerId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const locations = await prisma.locations.findMany({
      where: {
        customer_id: decoded.customerId
      },
      include: {
        _count: {
          select: {
            inventories: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      locations,
      success: true
    })

  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST - Create new location
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded || !decoded.customerId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 })
    }

    // Check if location already exists for this customer
    const existingLocation = await prisma.locations.findFirst({
      where: {
        customer_id: decoded.customerId,
        name: name.trim()
      }
    })

    if (existingLocation) {
      return NextResponse.json({ error: 'Location already exists' }, { status: 409 })
    }

    const location = await prisma.locations.create({
      data: {
        customer_id: decoded.customerId,
        name: name.trim()
      },
      include: {
        _count: {
          select: {
            inventories: true
          }
        }
      }
    })

    return NextResponse.json({
      location,
      success: true
    })

  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
