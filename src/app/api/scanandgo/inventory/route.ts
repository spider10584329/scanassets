import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customer_id = searchParams.get('customer_id')
    const apikey = searchParams.get('apikey')

    // Validate required parameters
    if (!customer_id || !apikey) {
      return NextResponse.json({
        success: false,
        message: 'customer_id and apikey parameters are required'
      }, { status: 400 })
    }

    // Convert customer_id to number
    const customerIdNumber = parseInt(customer_id)
    if (isNaN(customerIdNumber)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid customer_id format'
      }, { status: 400 })
    }

    // Validate API key against database
    try {
      // Check if the API key exists and belongs to the specified customer_id
      const apiKeyValidation = await prisma.$queryRaw<Array<{count: number}>>`
        SELECT COUNT(*) as count FROM apikey 
        WHERE api_key = ${apikey} AND customer_id = ${customerIdNumber}
      `
      
      // Handle BigInt count properly - convert to number for comparison
      const count = apiKeyValidation?.[0]?.count ? Number(apiKeyValidation[0].count) : 0
      
      if (!apiKeyValidation || apiKeyValidation.length === 0 || count === 0) {
        return NextResponse.json({
          success: false,
          message: 'The API key is invalid.'
        }, { status: 401 })
      }
    } catch (error) {
      console.error('[ERROR] API key validation database error:', error)
      // Always deny access if there's a database error
      return NextResponse.json({
        success: false,
        message: 'The API key is invalid.'
      }, { status: 401 })
    }

    // Fetch inventory data with related data for name resolution
    const inventories = await prisma.inventories.findMany({
      where: {
        customer_id: customerIdNumber
      },
      include: {
        assets: true,
        locations: true
      }
    })

    // Transform the data to include names instead of IDs
    type InventoryWithRelations = typeof inventories[0]
    const transformedInventories = inventories.map((inventory: InventoryWithRelations) => ({
      id: inventory.id,
      customer_id: inventory.customer_id,
      asset_id: inventory.asset_id,
      asset_name: inventory.assets?.name || null,
      location_id: inventory.location_id,
      location_name: inventory.locations?.name || null,
      purchase_date: inventory.purchase_date,
      last_date: inventory.last_date,
      ref_client: inventory.ref_client,
      status: inventory.status,
      reg_date: inventory.reg_date,
      inv_date: inventory.inv_date,
      comment: inventory.comment,
      rfid: inventory.rfid,
      operator_id: inventory.operator_id,
      room_assignment: inventory.room_assignment,
      category_df_immonet: inventory.category_df_immonet,
      purchase_amount: inventory.purchase_amount,
      is_throw: inventory.is_throw
    }))

    return NextResponse.json(transformedInventories)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      data: null
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
