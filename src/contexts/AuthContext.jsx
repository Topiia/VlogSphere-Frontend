import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'))
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Set auth header
          authAPI.setAuthHeader(token)
          
          // Get user data
          const response = await authAPI.getMe()
          setUser(response.data.user)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Auth initialization failed:', error)
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [token])

  // Auto refresh token before expiration
  useEffect(() => {
    if (refreshToken) {
      const refreshInterval = setInterval(async () => {
        try {
          const response = await authAPI.refreshToken(refreshToken)
          const { accessToken, refreshToken: newRefreshToken } = response.data
          
          setToken(accessToken)
          setRefreshToken(newRefreshToken)
          localStorage.setItem('token', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          authAPI.setAuthHeader(accessToken)
        } catch (error) {
          console.error('Token refresh failed:', error)
          logout()
        }
      }, 25 * 60 * 1000) // Refresh every 25 minutes

      return () => clearInterval(refreshInterval)
    }
  }, [refreshToken])

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authAPI.login({ email, password, rememberMe })
      const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data

      setToken(newToken)
      setRefreshToken(newRefreshToken)
      setUser(userData)
      setIsAuthenticated(true)

      // Store tokens
      if (rememberMe) {
        localStorage.setItem('token', newToken)
        localStorage.setItem('refreshToken', newRefreshToken)
      } else {
        sessionStorage.setItem('token', newToken)
        sessionStorage.setItem('refreshToken', newRefreshToken)
      }

      // Set auth header
      authAPI.setAuthHeader(newToken)

      toast.success('Welcome back!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const { token: newToken, refreshToken: newRefreshToken, user: userInfo } = response.data

      setToken(newToken)
      setRefreshToken(newRefreshToken)
      setUser(userInfo)
      setIsAuthenticated(true)

      // Store tokens
      localStorage.setItem('token', newToken)
      localStorage.setItem('refreshToken', newRefreshToken)

      // Set auth header
      authAPI.setAuthHeader(newToken)

      toast.success('Account created successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear all data
      setUser(null)
      setToken(null)
      setRefreshToken(null)
      setIsAuthenticated(false)
      
      // Clear storage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('refreshToken')
      
      // Clear auth header
      authAPI.setAuthHeader(null)
      
      toast.success('Logged out successfully')
    }
  }

  const updateUser = async (userData) => {
    try {
      const response = await authAPI.updateDetails(userData)
      setUser(response.data.user)
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.updatePassword({ currentPassword, newPassword })
      toast.success('Password updated successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Password update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    token,
    refreshToken,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}