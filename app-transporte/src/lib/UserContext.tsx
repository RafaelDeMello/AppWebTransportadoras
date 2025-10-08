'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface UserInfo {
  id: string
  email: string
  role: 'ADMIN_TRANSPORTADORA' | 'MOTORISTA'
  transportadora?: {
    id: string
    nome: string
    cnpj: string
  }
  motorista?: {
    id: string
    nome: string
    cpf: string
  }
}

interface UserContextType {
  userInfo: UserInfo | null
  loading: boolean
  refetch: () => Promise<void>
  reset: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserInfo = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/me', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (res.ok) {
        const user = await res.json()
        setUserInfo(user)
      } else {
        setUserInfo(null)
      }
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error)
      setUserInfo(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserInfo()
  }, [])

  const refetch = async () => {
    await fetchUserInfo()
  }

  const reset = () => {
    setUserInfo(null)
    setLoading(false)
  }

  return (
    <UserContext.Provider value={{ userInfo, loading, refetch, reset }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}