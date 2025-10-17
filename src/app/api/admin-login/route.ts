import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { generateToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    
    try {
      // Try to authenticate with PulsePoint API
      const response = await axios.post('https://api.pulsepoint.myrfid.nc/api/user/project/signin', {
        username: email,
        password: password,
        projectId: 7
      })

      if (response.data.status === 1) {
        // Get user details from PulsePoint
        const userDetailsResponse = await axios.get('https://api.pulsepoint.myrfid.nc/api/user/allusers', {
          auth: {
            username: 'admin',
            password: 'admin'
          }
        })

        const allUsers = userDetailsResponse.data?.data || userDetailsResponse.data || []
        const user = allUsers.find((u: { email?: string; id: number; status: number }) => 
          u.email?.toLowerCase() === email.toLowerCase()
        )

        if (user) {
          // Generate JWT token with admin role
          const token = await generateToken({
            customerId: user.id,
            userId: user.id,
            username: user.email,
            email: user.email,
            role: 'admin',
            isActive: user.status === 1
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
        message: 'Login failed'
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
