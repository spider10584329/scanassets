import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { generateToken } from '@/lib/jwt'

// PulsePoint API configuration from environment variables
const PULSEPOINT_API_URL = process.env.PULSEPOINT_API_URL || 'https://api.pulsepoint.clinotag.com'
const PULSEPOINT_API_USERNAME = process.env.PULSEPOINT_API_USERNAME
const PULSEPOINT_API_PASSWORD = process.env.PULSEPOINT_API_PASSWORD
const PULSEPOINT_PROJECT_ID = parseInt(process.env.PULSEPOINT_PROJECT_ID || '19')

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check that PulsePoint credentials are configured
    if (!PULSEPOINT_API_USERNAME || !PULSEPOINT_API_PASSWORD) {
      console.error('PulsePoint API credentials not configured in environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    try {
      // Try to authenticate with PulsePoint API with timeout
      const response = await axios.post(`${PULSEPOINT_API_URL}/api/user/project/signin`, {
        username: email,
        password: password,
        projectId: PULSEPOINT_PROJECT_ID
      }, {
        timeout: 10000 // 10 second timeout to prevent hanging
      })

      if (response.data.status === 1) {
        // Get user details from PulsePoint
        const userDetailsResponse = await axios.get(`${PULSEPOINT_API_URL}/api/user/allusers`, {
          auth: {
            username: PULSEPOINT_API_USERNAME,
            password: PULSEPOINT_API_PASSWORD
          },
          timeout: 10000 // 10 second timeout
        })

        const allUsers = userDetailsResponse.data?.data || userDetailsResponse.data || []
        const user = allUsers.find((u: { email?: string; id: number; status: number }) => 
          u.email?.toLowerCase() === email.toLowerCase()
        )

        if (user) {
          console.log('Admin login - User found:', {
            id: user.id,
            email: user.email,
            status: user.status
          })

          // Generate JWT token with admin role
          // Admin users should be considered active if they can log in to PulsePoint
          const token = await generateToken({
            customerId: user.id,
            userId: user.id,
            username: user.email,
            email: user.email,
            role: 'admin',
            isActive: true  // Admin users who can authenticate are considered active
          })

          return NextResponse.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
              customerId: user.id,
              id: user.id,
              username: user.email,
              email: user.email,
              role: 'admin'
            }
          })
        } else {
          return NextResponse.json({
            success: false,
            message: 'User account not found in system'
          })
        }
      } else if (response.data.status === -1) {
        return NextResponse.json({
          success: false,
          message: 'Account not found'
        })
      } else if (response.data.status === 0) {
        return NextResponse.json({
          success: false,
          message: 'Incorrect password'
        })
      }

      return NextResponse.json({
        success: false,
        message: 'Login failed : Find out about your subscription status for this project.'
      })
    } catch (apiError) {
      console.error('PulsePoint API error:', apiError)
      return NextResponse.json({
        success: false,
        message: 'External authentication service unavailable'
      })
    }

  } catch (error: unknown) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    )
  }
}
