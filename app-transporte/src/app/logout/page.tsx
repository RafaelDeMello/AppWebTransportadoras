'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'

export default function LogoutPage() {
  const router = useRouter()
  const { logout } = useUser()
  
  useEffect(() => {
    const doLogout = async () => {
      await logout()
      router.replace('/login')
    }
    void doLogout()
  }, [router, logout])
  
  return null
}
