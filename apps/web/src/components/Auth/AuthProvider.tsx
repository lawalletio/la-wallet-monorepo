import { useWalletContext } from '@lawallet/hooks'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import React, { useLayoutEffect } from 'react'

// const unloggedRoutes: string[] = ['/', '/start', '/login', '/reset']

const protectedRoutes: string[] = [
  '/dashboard',
  '/transfer',
  '/deposit',
  '/scan',
  '/settings',
  '/transactions',
  '/card'
]

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useWalletContext()

  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const isProtectedRoute = (path: string) => {
    let isProtected: boolean = false

    protectedRoutes.forEach(route => {
      if (path.startsWith(route)) isProtected = true
    })

    return isProtected
  }

  useLayoutEffect(() => {
    if (user.identity.loaded) {
      const protectedFlag = isProtectedRoute(pathname)
      const userLogged: boolean = Boolean(user.identity.hexpub.length)
      const nonce: string = params.get('i') || ''
      const card: string = params.get('c') || ''

      switch (true) {
        case !userLogged && pathname == '/' && !nonce:
          router.push('/')
          break

        case !userLogged && protectedFlag:
          router.push('/')
          break

        case userLogged && !protectedFlag:
          card
            ? router.push(`/settings/cards?c=${card}`)
            : router.push('/dashboard')
          break
      }
    }
  }, [pathname, user.identity.loaded])

  return children
}

export default AuthProvider
