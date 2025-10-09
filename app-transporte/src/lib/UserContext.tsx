'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface UserInfo {
  id: string
  email: string
  type: 'TRANSPORTADORA' | 'MOTORISTA'
  nome: string
  // Para transportadoras
  transportadoraId?: string
  transportadora?: {
    id: string
    nome: string
    cnpj: string
    telefone?: string
    endereco?: string
    createdAt: string
  }
  // Para motoristas
  motoristaId?: string
  motorista?: {
    id: string
    nome: string
    cpf: string
    cnh?: string
    telefone?: string
    transportadoraId: string
    codigoValidacao: string
    validado: boolean
    email: string
    createdAt: string
    updatedAt: string
    transportadora: {
      id: string
      nome: string
    }
  }
}

interface UserContextType {
  userInfo: UserInfo | null
  loading: boolean
  refetch: () => Promise<void>
  reset: () => void
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  logout: () => Promise<void>
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
        const response = await res.json()
        if (response.success && response.user) {
          setUserInfo(response.user)
        } else {
          setUserInfo(null)
        }
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

  const login = async (email: string, senha: string) => {
    try {
      console.log('🟡 [USER_CONTEXT] Iniciando login...')
      console.log('🟡 [USER_CONTEXT] Email:', email)
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      })

      console.log('🟡 [USER_CONTEXT] Status da resposta:', res.status)
      console.log('🟡 [USER_CONTEXT] Response OK:', res.ok)

      const data = await res.json()
      console.log('🟡 [USER_CONTEXT] Dados da resposta:', data)

      if (res.ok && data.success) {
        console.log('✅ [USER_CONTEXT] Login bem-sucedido! Definindo userInfo...')
        setUserInfo(data.user)
        return { success: true, redirectTo: data.redirectTo }
      } else {
        console.log('❌ [USER_CONTEXT] Falha no login:', data.error)
        return { success: false, error: data.error || 'Erro no login' }
      }
    } catch (error) {
      console.error('💥 [USER_CONTEXT] Erro no login:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUserInfo(null)
      // Redirecionar para login
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, limpar estado local
      setUserInfo(null)
      window.location.href = '/login'
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
    <UserContext.Provider value={{ userInfo, loading, refetch, reset, login, logout }}>
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