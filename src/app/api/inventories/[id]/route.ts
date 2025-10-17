import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    let decoded: { customerId?: number }
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { customerId?: number }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const customerId = decoded.customerId
    if (!customerId) {
      return NextResponse.json({ error: 'Invalid token - no customer ID' }, { status: 401 })
    }

    const resolvedParams = await params
    const inventoryId = parseInt(resolvedParams.id)
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'Invalid inventory ID' }, { status: 400 })
    }

    const { rfid, asset_name } = await request.json()

    // Check if the inventory belongs to the customer
    const existingInventory = await prisma.inventories.findFirst({
      where: {
        id: inventoryId,
        customer_id: customerId
      },
      include: {
        assets: true
      }
    })

    if (!existingInventory) {
      return NextResponse.json({ error: 'Inventory not found or not authorized' }, { status: 404 })
    }

    // Update the inventory RFID
    const updatedInventory = await prisma.inventories.update({
      where: {
        id: inventoryId
      },
      data: {
        rfid: rfid
      }
    })

    // Update the asset name if provided and asset exists
    if (asset_name !== undefined && existingInventory.assets && existingInventory.asset_id) {
      await prisma.assets.update({
        where: {
          id: existingInventory.asset_id
        },
        data: {
          name: asset_name
        }
      })
    }

    return NextResponse.json({
      success: true,
      inventory: updatedInventory
    })

  } catch {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    let decoded: { customerId?: number }
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { customerId?: number }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const customerId = decoded.customerId
    if (!customerId) {
      return NextResponse.json({ error: 'Invalid token - no customer ID' }, { status: 401 })
    }

    const resolvedParams = await params
    const inventoryId = parseInt(resolvedParams.id)
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'Invalid inventory ID' }, { status: 400 })
    }

    // Check if the inventory belongs to the customer
    const existingInventory = await prisma.inventories.findFirst({
      where: {
        id: inventoryId,
        customer_id: customerId
      }
    })

    if (!existingInventory) {
      return NextResponse.json({ error: 'Inventory not found or not authorized' }, { status: 404 })
    }

    // Delete the inventory
    await prisma.inventories.delete({
      where: {
        id: inventoryId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Inventory deleted successfully'
    })

  } catch {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
