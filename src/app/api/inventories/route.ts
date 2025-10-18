import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const searchTerm = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build the where clause
    const whereClause: {
      customer_id: number;
      location_id?: number;
      OR?: Array<{
        rfid?: { contains: string };
        assets?: { name?: { contains: string } };
        locations?: { name?: { contains: string } };
      }>;
    } = {
      customer_id: customerId
    }

    // If location_id is provided, filter by it
    if (locationId) {
      whereClause.location_id = parseInt(locationId)
    }

    // If search term is provided, add search conditions
    if (searchTerm && searchTerm.trim()) {
      whereClause.OR = [
        {
          rfid: {
            contains: searchTerm.trim()
          }
        },
        {
          assets: {
            name: {
              contains: searchTerm.trim()
            }
          }
        },
        {
          locations: {
            name: {
              contains: searchTerm.trim()
            }
          }
        }
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.inventories.count({
      where: whereClause
    })

    // Fetch inventory data with pagination
    const inventories = await prisma.inventories.findMany({
      where: whereClause,
      include: {
        assets: true,
        locations: true
      },
      orderBy: {
        id: 'desc'
      },
      skip: offset,
      take: limit
    })

    // Transform the data
    const transformedInventories = inventories.map((inventory) => ({
      id: inventory.id,
      customer_id: inventory.customer_id,
      asset_id: inventory.asset_id,
      asset_name: inventory.assets?.name || null,
      location_id: inventory.location_id,
      location_name: inventory.locations?.name || null,
      rfid: inventory.rfid,
      purchase_date: inventory.purchase_date,
      last_date: inventory.last_date,
      ref_client: inventory.ref_client,
      status: inventory.status,
      reg_date: inventory.reg_date,
      inv_date: inventory.inv_date,
      comment: inventory.comment,
      operator_id: inventory.operator_id,
      room_assignment: inventory.room_assignment,
      category_df_immonet: inventory.category_df_immonet,
      purchase_amount: inventory.purchase_amount,
      is_throw: inventory.is_throw
    }))

    return NextResponse.json({
      success: true,
      inventories: transformedInventories,
      total: totalCount,
      page: page,
      limit: limit,
      hasMore: offset + inventories.length < totalCount
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
