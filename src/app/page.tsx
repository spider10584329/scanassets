'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { toastSuccess, toastError } from '@/components/ui/toast'
import axios from 'axios'

export default function Home() {
  const router = useRouter()
  const { clearStaleTokens, login } = useAuthContext()
  const [isLogin, setIsLogin] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'agent'>('agent')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  })
  const [submitLoading, setSubmitLoading] = useState(false)

  // Always clear authentication data when landing on home page for fresh start
  useEffect(() => {
    localStorage.removeItem('auth-token')
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict'
    localStorage.clear()
    sessionStorage.clear()
    clearStaleTokens()
  }, [clearStaleTokens])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLoginClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      if (userRole === 'admin') {
        // Admin login via PulsePoint
        const response = await axios.post('/api/admin-login', {
          email: formData.email,
          password: formData.password
        })

        if (response.data.success && response.data.token) {
          const loginSuccess = await login(response.data.token)
          
          if (loginSuccess) {
            toastSuccess('Login successful! Redirecting...')
            setFormData({ email: '', password: '', username: '', confirmPassword: '' })
            setTimeout(() => {
              router.push('/admin/dashboard')
            }, 1000)
          } else {
            toastError('Login validation failed. Please try again.')
          }
        } else {
          toastError(response.data.message || 'Login failed')
        }
      } else {
        // Agent login
        const response = await axios.post('/api/user-login', {
          username: formData.email, // Using email field for username
          password: formData.password
        })

        if (response.data.success && response.data.token) {
          const loginSuccess = await login(response.data.token)
          
          if (loginSuccess) {
            toastSuccess('Login successful! Redirecting...')
            setFormData({ email: '', password: '', username: '', confirmPassword: '' })
            setTimeout(() => {
              router.push('/agent/dashboard')
            }, 1000)
          } else {
            toastError('Login validation failed. Please try again.')
          }
        } else {
          toastError(response.data.message || 'Login failed. Please check your credentials.')
        }
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      toastError('Failed to connect to server')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleRegisterClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toastError('Passwords do not match. Please try again.')
      return
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(formData.password)) {
      toastError('Password must be at least 8 characters with uppercase, lowercase, and number.')
      return
    }

    setSubmitLoading(true)

    try {
      // Check if admin email exists in PulsePoint API
      const adminCheckResponse = await fetch('https://api.pulsepoint.clinotag.com/api/user/allusers', {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa('admin:admin'),
          'Content-Type': 'application/json',
        },
      })

      if (!adminCheckResponse.ok) {
        throw new Error('Failed to verify administrator email')
      }

      const adminData = await adminCheckResponse.json()
      const allUsers = adminData?.data || adminData || []
      
      const adminUser = allUsers.find((user: { email?: string; id: number }) => 
        user.email?.toLowerCase() === formData.email.toLowerCase()
      )
      
      if (!adminUser) {
        toastError('Administrator email does not exist in PulsePoint system.')
        setSubmitLoading(false)
        return
      }

      const customerId = adminUser.id

      // Check if username already exists
      const usernameCheckResponse = await fetch('/api/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
        }),
      })

      const usernameCheck = await usernameCheckResponse.json()
      
      if (usernameCheck.exists) {
        toastError('Account already exists with this username. Please choose another.')
        setSubmitLoading(false)
        return
      }

      // Register the new user
      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: formData.email,
          username: formData.username,
          password: formData.password,
          customerId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      if (data.success) {
        toastSuccess('Account pending approval. Please sign in.')
        setIsLogin(true)
        setFormData({
          email: '',
          password: '',
          username: '',
          confirmPassword: '',
        })
      } else {
        throw new Error(data.message || 'Registration failed')
      }
    } catch (err: unknown) {
      console.error('Registration error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to register. Please try again.'
      toastError(errorMessage)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-300" >
      {/* Login Card */}
      <div className="rounded-lg shadow-2xl overflow-hidden w-full max-w-6xl mx-auto bg-white">
        <div className="flex flex-col xl:flex-row min-h-[500px] xl:min-h-[600px]">
          {/* Logo Section */}
          <div className="xl:w-2/5 w-full flex items-center justify-center p-8 xl:p-12" 
               style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Image 
                src="/logo-bleu.svg" 
                alt="ShareCells Logo" 
                width={50}
                height={50}
                className="w-full max-w-xs xl:max-w-md h-auto object-contain"
              />
             
            </div>
          </div>

          {/* Form Section */}
          <div className="xl:w-3/5 w-full px-6 sm:px-8 xl:px-12 py-8 xl:py-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <div className="text-center mb-6">
                <h1 className="text-2xl xl:text-3xl font-semibold mb-4 text-gray-800">
                  {isLogin ? 'Sign in to Your Account' : 'Create Your Account'}
                </h1>
                
                {/* Admin/Agent Toggle - Only on Sign In */}
                {isLogin && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full p-1 bg-gray-100">
                      <button
                        onClick={() => setUserRole('admin')}
                        className={`px-4 py-1 rounded-full text-sm  transition-all duration-200 ${
                          userRole === 'admin'
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                            : 'bg-transparent text-gray-600'
                        }`}
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => setUserRole('agent')}
                        className={`px-4 py-1 rounded-full text-sm  transition-all duration-200 ${
                          userRole === 'agent'
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                            : 'bg-transparent text-gray-600'
                        }`}
                      >
                        Agent
                      </button>
                    </div>
                    {userRole === 'admin' && (
                      <p className="text-xs text-gray-600">
                        You must sign in with a pulsepoint account.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {isLogin ? (
                // Login Form
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
                      {userRole === 'admin' ? 'Manager Email' : 'Username'}
                    </label>
                    <input
                      type={userRole === 'admin' ? 'email' : 'text'}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder={userRole === 'admin' ? 'Enter your manager email' : 'Enter your username'}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="Enter your password"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleLoginClick}
                      disabled={submitLoading}
                      className="w-full font-semibold py-2 px-6 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      {submitLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </div>
                </div>
              ) : (
                // Registration Form
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
                      Manager Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="Email address"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-700">
                      Username *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="Username"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="Password"
                    />
                    <p className="text-xs mt-1 text-gray-500">
                      Min 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-700">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="Confirm password"
                    />
                  </div>

                  <button
                    onClick={handleRegisterClick}
                    disabled={submitLoading}
                    className="w-full font-semibold py-2 px-6 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {submitLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-medium text-indigo-600 hover:text-purple-600 transition-colors duration-200"
                  >
                    {isLogin ? 'Register' : 'Sign in here'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
