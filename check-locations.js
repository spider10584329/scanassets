const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('=== DATABASE CHECK ===')
    
    // Check all customers (from various tables that have customer_id)
    console.log('\n1. Checking customer IDs from operators table:')
    const operators = await prisma.operators.findMany({
      select: { customer_id: true }
    })
    const customerIds = [...new Set(operators.map(op => op.customer_id))]
    console.log('Customer IDs found:', customerIds)
    
    // Check all locations
    console.log('\n2. All locations in database:')
    const allLocations = await prisma.locations.findMany({
      select: {
        id: true,
        customer_id: true,
        name: true,
        _count: {
          select: {
            inventories: true
          }
        }
      }
    })
    console.log('Total locations:', allLocations.length)
    allLocations.forEach(loc => {
      console.log(`  ID: ${loc.id}, Customer: ${loc.customer_id}, Name: "${loc.name}", Assets: ${loc._count.inventories}`)
    })
    
    // Check locations per customer
    console.log('\n3. Locations grouped by customer:')
    for (const customerId of customerIds) {
      const customerLocations = await prisma.locations.findMany({
        where: { customer_id: customerId },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              inventories: true
            }
          }
        }
      })
      console.log(`Customer ${customerId}: ${customerLocations.length} locations`)
      customerLocations.forEach(loc => {
        console.log(`    - "${loc.name}" (ID: ${loc.id}, Assets: ${loc._count.inventories})`)
      })
    }
    
    // Check if there are any assets/inventories
    console.log('\n4. Checking inventories:')
    const totalInventories = await prisma.inventories.count()
    console.log('Total inventories:', totalInventories)
    
    if (totalInventories > 0) {
      const inventoriesByCustomer = await prisma.inventories.groupBy({
        by: ['customer_id'],
        _count: {
          id: true
        }
      })
      console.log('Inventories by customer:')
      inventoriesByCustomer.forEach(inv => {
        console.log(`  Customer ${inv.customer_id}: ${inv._count.id} inventories`)
      })
    }
    
  } catch (error) {
    console.error('Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
