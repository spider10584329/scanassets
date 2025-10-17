import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/jwt'

const prisma = new PrismaClient()

// DELETE - Delete a location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const locationId = parseInt(resolvedParams.id)
    if (isNaN(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    // Check if location exists and belongs to the customer
    const location = await prisma.locations.findFirst({
      where: {
        id: locationId,
        customer_id: decoded.customerId
      }
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check if location has associated inventories
    const inventoryCount = await prisma.inventories.count({
      where: {
        location_id: locationId
      }
    })

    if (inventoryCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete location. It has ${inventoryCount} associated assets.` },
        { status: 409 }
      )
    }

    await prisma.locations.delete({
      where: {
        id: locationId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}

// PUT - Update a location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const locationId = parseInt(resolvedParams.id)
    if (isNaN(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 })
    }

    // Check if location exists and belongs to the customer
    const location = await prisma.locations.findFirst({
      where: {
        id: locationId,
        customer_id: decoded.customerId
      }
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check if another location with the same name exists
    const existingLocation = await prisma.locations.findFirst({
      where: {
        customer_id: decoded.customerId,
        name: name.trim(),
        id: { not: locationId }
      }
    })

    if (existingLocation) {
      return NextResponse.json({ error: 'Location name already exists' }, { status: 409 })
    }

    const updatedLocation = await prisma.locations.update({
      where: {
        id: locationId
      },
      data: {
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
      location: updatedLocation,
      success: true
    })

  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}
