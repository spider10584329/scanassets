const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test queries on each table
    console.log('\n📊 Testing table access:');
    
    const roles = await prisma.role.count();
    console.log(`- Roles: ${roles} records`);
    
    const users = await prisma.users.count();
    console.log(`- Users: ${users} records`);
    
    const assets = await prisma.assets.count();
    console.log(`- Assets: ${assets} records`);
    
    const locations = await prisma.locations.count();
    console.log(`- Locations: ${locations} records`);
    
    const inventories = await prisma.inventories.count();
    console.log(`- Inventories: ${inventories} records`);
    
    const operators = await prisma.operators.count();
    console.log(`- Operators: ${operators} records`);
    
    const snapshots = await prisma.snapshots.count();
    console.log(`- Snapshots: ${snapshots} records`);
    
    const apikeys = await prisma.apikey.count();
    console.log(`- API Keys: ${apikeys} records`);
    
    console.log('\n🎉 Database schema is working correctly!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
