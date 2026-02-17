'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthModal } from '@/components/auth/auth-modal'
import { useUser } from '@/contexts/user-context'
import { useAuthModal } from '@/contexts/auth-modal-context'

export function AuthWrapper({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUser()
  const { isOpen, openAuthModal, closeAuthModal } = useAuthModal()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/landing']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Disabled: We're now using ProtectedRoute components instead of global auth wrapper
  // useEffect(() => {
  //   // If user tries to access protected route and is not authenticated, show modal
  //   if (!isAuthenticated && !isPublicRoute) {
  //     openAuthModal()
  //   }
  // }, [pathname, isAuthenticated])

  const handleCloseModal = () => {
    closeAuthModal()
    // Redirect back to landing if not authenticated
    if (!isAuthenticated) {
      window.location.href = '/landing'
    }
  }

  return (
    <>
      {children}
      <AuthModal isOpen={isOpen} onClose={handleCloseModal} />
    </>
  )
}
