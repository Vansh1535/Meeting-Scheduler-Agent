import type { Metadata } from 'next'
import { Sora, Outfit } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AppLayout } from '@/components/app-layout'
import { QueryProvider } from '@/components/providers/query-provider'
import { UserProvider } from '@/contexts/user-context'
import { AuthProvider } from '@/contexts/auth-context'
import { AuthModalProvider } from '@/contexts/auth-modal-context'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { Toaster } from 'sonner'

import './globals.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Bright Flow - Premium Event Scheduling',
  description: 'Beautiful, minimalist event scheduling and time management',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sora.variable} ${outfit.variable}`}>
      <body className="font-sora antialiased">
        <QueryProvider>
          <AuthProvider>
            <AuthModalProvider>
              <UserProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                  <AuthWrapper>
                    <AppLayout>
                      {children}
                    </AppLayout>
                  </AuthWrapper>
                  <Toaster position="top-right" richColors />
                </ThemeProvider>
              </UserProvider>
            </AuthModalProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
