'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, User, Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

type AuthMode = 'login' | 'signup'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const { login, signup } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password)
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        await signup(formData.email, formData.password, formData.fullName)
      }
      onClose()
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    console.log('Google auth clicked')
    // TODO: Implement Google OAuth
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 z-50">
        <div className="p-8 rounded-3xl bg-card shadow-elevation-4 border border-border/40">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-outfit font-bold text-foreground mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-muted-foreground font-sora text-sm">
              {mode === 'login'
                ? 'Sign in to access your calendar'
                : 'Create an account to schedule beautifully'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-3 mb-8 p-1.5 bg-muted/50 rounded-2xl">
            <button
              onClick={() => {
                setMode('login')
                setError(null)
              }}
              className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setMode('signup')
                setError(null)
              }}
              className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Signup Only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required={mode === 'signup'}
                    className="pl-12 h-11 rounded-xl border-border/50 focus:shadow-elevation-2 focus:border-primary/40 transition-all duration-300 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-12 h-11 rounded-xl border-border/50 focus:shadow-elevation-2 focus:border-primary/40 transition-all duration-300 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-12 pr-12 h-11 rounded-xl border-border/50 focus:shadow-elevation-2 focus:border-primary/40 transition-all duration-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup Only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={mode === 'signup'}
                    className="pl-12 pr-12 h-11 rounded-xl border-border/50 focus:shadow-elevation-2 focus:border-primary/40 transition-all duration-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-sm shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
            >
              {loading
                ? 'Loading...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Or
            </span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleAuth}
            className="w-full h-11 rounded-xl font-semibold text-sm border-primary/30 hover:border-primary/60 hover:bg-primary/5 shadow-soft hover:shadow-elevation-2 transition-all duration-300"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-5">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
