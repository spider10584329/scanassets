const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('=== USER CHECK ===')
    
    // Check users table (admin users)
    console.log('\n1. Admin users in users table:')
    const adminUsers = await prisma.users.findMany({
      include: {
        roleRef: true
      }
    })
    console.log('Total admin users:', adminUsers.length)
    adminUsers.forEach(user => {
      console.log(`  ID: ${user.id}, Username: "${user.username}", Role: ${user.role} (${user.roleRef?.name || 'N/A'})`)
    })
    
    // Check operators table
    console.log('\n2. Operators in operators table:')
    const operators = await prisma.operators.findMany()
    console.log('Total operators:', operators.length)
    operators.forEach(op => {
      console.log(`  ID: ${op.id}, Customer: ${op.customer_id}, Username: "${op.username}"`)
    })
    
    // Check roles
    console.log('\n3. Available roles:')
    const roles = await prisma.role.findMany()
    roles.forEach(role => {
      console.log(`  ID: ${role.id}, Name: "${role.name}"`)
    })
    
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
