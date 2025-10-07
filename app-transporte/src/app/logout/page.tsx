'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutPage() {
  const router = useRouter()
  useEffect(() => {
    const doLogout = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace('/login')
    }
    void doLogout()
  }, [router])
  return null
}
