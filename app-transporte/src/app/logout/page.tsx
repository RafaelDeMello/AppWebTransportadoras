'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/UserContext'

export default function LogoutPage() {
  const router = useRouter()
  const { reset } = useUser()
  
  useEffect(() => {
    const doLogout = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      // Limpar o contexto do usuário
      reset()
      router.replace('/login')
    }
    void doLogout()
  }, [router, reset])
  return null
}
