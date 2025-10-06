import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export interface AuthUser {
  id: string
  email: string
  role: 'ADMIN_TRANSPORTADORA' | 'MOTORISTA'
  transportadoraId: string | null
  motoristaId: string | null
  supabaseUid: string
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const { supabase } = createClient(request)

    // Verificar se há um usuário autenticado no Supabase
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Buscar dados completos do usuário no nosso banco
    const userData = await prisma.usuario.findUnique({
      where: { supabaseUid: user.id },
      include: {
        transportadora: true,
        motorista: true
      }
    })

    if (!userData) {
      return null
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      transportadoraId: userData.transportadoraId,
      motoristaId: userData.motoristaId,
      supabaseUid: userData.supabaseUid
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return null
  }
}

export function hasPermission(
  user: AuthUser,
  requiredRole?: 'ADMIN_TRANSPORTADORA' | 'MOTORISTA',
  transportadoraId?: string
): boolean {
  // Verificar role se especificado
  if (requiredRole && user.role !== requiredRole) {
    return false
  }

  // Verificar se tem acesso à transportadora específica
  if (transportadoraId && user.transportadoraId !== transportadoraId) {
    return false
  }

  return true
}

export function canAccessTransportadora(
  user: AuthUser,
  transportadoraId: string
): boolean {
  // Admin da transportadora pode acessar
  if (user.role === 'ADMIN_TRANSPORTADORA' && user.transportadoraId === transportadoraId) {
    return true
  }

  // Motorista pode acessar dados da sua transportadora
  if (user.role === 'MOTORISTA' && user.transportadoraId === transportadoraId) {
    return true
  }

  return false
}

export function canAccessMotorista(
  user: AuthUser,
  motoristaId: string,
  transportadoraId?: string
): boolean {
  // Admin da transportadora pode acessar motoristas da sua empresa
  if (user.role === 'ADMIN_TRANSPORTADORA' && transportadoraId && user.transportadoraId === transportadoraId) {
    return true
  }

  // Motorista só pode acessar seus próprios dados
  if (user.role === 'MOTORISTA' && user.motoristaId === motoristaId) {
    return true
  }

  return false
}