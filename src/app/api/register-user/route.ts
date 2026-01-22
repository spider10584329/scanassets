import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import axios from 'axios'

// PulsePoint API configuration from environment variables
const PULSEPOINT_API_URL = process.env.PULSEPOINT_API_URL || 'https://api.pulsepoint.clinotag.com'
const PULSEPOINT_API_USERNAME = process.env.PULSEPOINT_API_USERNAME
const PULSEPOINT_API_PASSWORD = process.env.PULSEPOINT_API_PASSWORD

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, username, password } = await request.json()

    if (!adminEmail || !username || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters with uppercase, lowercase, and number' },
        { status: 400 }
      )
    }

    // Check if PulsePoint credentials are configured
    if (!PULSEPOINT_API_USERNAME || !PULSEPOINT_API_PASSWORD) {
      console.error('PulsePoint API credentials not configured')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    // SERVER-SIDE: Verify admin email exists in PulsePoint and get customer ID
    let customerId: number
    try {
      const adminCheckResponse = await axios.get(`${PULSEPOINT_API_URL}/api/user/allusers`, {
        auth: {
          username: PULSEPOINT_API_USERNAME,
          password: PULSEPOINT_API_PASSWORD
        },
        timeout: 10000 // 10 second timeout to prevent hanging
      })
      
      const allUsers = adminCheckResponse.data?.data || adminCheckResponse.data || []
      const adminUser = allUsers.find((user: { email?: string; id: number }) => 
        user.email?.toLowerCase() === adminEmail.toLowerCase()
      )
      
      if (!adminUser) {
        return NextResponse.json(
          { success: false, message: 'Administrator email does not exist in system' },
          { status: 404 }
        )
      }
      
      customerId = adminUser.id
    } catch (apiError) {
      console.error('PulsePoint API error during registration:', apiError)
      return NextResponse.json(
        { success: false, message: 'Failed to verify administrator email. External service unavailable.' },
        { status: 503 }
      )
    }

    // Check if username already exists in database
    const existingUser = await prisma.operators.findFirst({
      where: { username: username }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username already exists' },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insert new user into operators table
    const newUser = await prisma.operators.create({
      data: {
        customer_id: customerId,
        username: username,
        password: hashedPassword,
        isPasswordRequest: 0,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User registered successfully. Account pending approval.',
      userId: newUser.id
    })

  } catch (error: unknown) {
    console.error('Registration error:', error)
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Username already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    )
  }
}
