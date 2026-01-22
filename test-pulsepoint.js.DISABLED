const axios = require('axios')

async function testPulsePointAPI() {
  try {
    console.log('=== TESTING PULSEPOINT API ===')
    
    // First, let's see what users exist in the system
    console.log('\n1. Getting all users from PulsePoint...')
    try {
      const userDetailsResponse = await axios.get('https://api.pulsepoint.myrfid.nc/api/user/allusers', {
        auth: {
          username: 'admin',
          password: 'admin'
        },
        timeout: 10000
      })
      
      console.log('User Details Response Status:', userDetailsResponse.status)
      const allUsers = userDetailsResponse.data?.data || userDetailsResponse.data || []
      console.log('All Users Count:', allUsers.length)
      console.log('Available users:', allUsers)
      
      if (allUsers.length > 0) {
        console.log('\nAvailable users with emails:')
        allUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. ID: ${user.id}, Email: ${user.email}, Status: ${user.status}`)
        })
      }
      
    } catch (userError) {
      console.log('❌ User details API error:', userError.message)
    }
    
    // Test 2: Try to authenticate with PulsePoint API using CORRECT email
    console.log('\n2. Testing authentication with adam.p@gmail.com (CORRECTED)...')
    try {
      const authResponse = await axios.post('https://api.pulsepoint.myrfid.nc/api/user/project/signin', {
        username: 'adam.p@gmail.com',  // Fixed typo: gmail not gamil
        password: '123456',
        projectId: 7
      }, {
        timeout: 10000
      })
      
      console.log('Auth Response Status:', authResponse.status)
      console.log('Auth Response Data:', authResponse.data)
      
      if (authResponse.data.status === 1) {
        console.log('✅ Authentication successful')
        
        // Test 2: Get user details
        console.log('\n2. Testing user details...')
        try {
          const userDetailsResponse = await axios.get('https://api.pulsepoint.myrfid.nc/api/user/allusers', {
            auth: {
              username: 'admin',
              password: 'admin'
            },
            timeout: 10000
          })
          
          console.log('User Details Response Status:', userDetailsResponse.status)
          console.log('User Details Response Data:', userDetailsResponse.data)
          
          const allUsers = userDetailsResponse.data?.data || userDetailsResponse.data || []
          console.log('All Users Count:', allUsers.length)
          
          const user = allUsers.find((u) => 
            u.email?.toLowerCase() === 'adam.p@gmail.com'.toLowerCase()  // Fixed typo
          )
          
          if (user) {
            console.log('✅ Found user:', user)
            console.log('Customer ID from API:', user.id)
          } else {
            console.log('❌ User not found in response')
          }
          
        } catch (userError) {
          console.log('❌ User details API error:', userError.message)
        }
        
      } else {
        console.log('❌ Authentication failed. Status:', authResponse.data.status)
      }
      
    } catch (authError) {
      console.log('❌ Authentication API error:', authError.message)
      if (authError.code) {
        console.log('Error Code:', authError.code)
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message)
  }
}

testPulsePointAPI()
