// Test script to debug the users API
const testUsersAPI = async () => {
  try {
    console.log('Testing /api/users endpoint...');
    
    // First, let's test with a mock JWT token - we'll get a 401 but we want to see if it hits the endpoint
    const response = await fetch('http://localhost:3001/api/users', {
      headers: {
        'Authorization': 'Bearer fake-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

// Run the test
testUsersAPI();
