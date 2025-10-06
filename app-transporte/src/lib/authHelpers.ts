import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, type AuthUser } from '@/lib/auth'

export interface ProtectedRouteOptions {
  requiredRole?: 'ADMIN_TRANSPORTADORA' | 'MOTORISTA'
  allowSameTransportadora?: boolean
  allowOwnerOnly?: boolean
}

export async function withAuth<T extends unknown[]>(
  request: NextRequest,
  handler: (user: AuthUser, request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: ProtectedRouteOptions = {},
  ...args: T
): Promise<NextResponse> {
  try {
    // Verificar autenticação
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token de autenticação inválido ou expirado' 
        },
        { status: 401 }
      )
    }

    // Verificar role se especificado
    if (options.requiredRole && user.role !== options.requiredRole) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Permissão insuficiente para acessar este recurso' 
        },
        { status: 403 }
      )
    }

    // Chamar o handler original com o usuário autenticado
    return await handler(user, request, ...args)
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// Helper específico para endpoints que requerem admin
export async function withAdminAuth<T extends unknown[]>(
  request: NextRequest,
  handler: (user: AuthUser, request: NextRequest, ...args: T) => Promise<NextResponse>,
  ...args: T
): Promise<NextResponse> {
  return withAuth(request, handler, { requiredRole: 'ADMIN_TRANSPORTADORA' }, ...args)
}

// Helper específico para endpoints que requerem motorista
export async function withMotoristaAuth<T extends unknown[]>(
  request: NextRequest,
  handler: (user: AuthUser, request: NextRequest, ...args: T) => Promise<NextResponse>,
  ...args: T
): Promise<NextResponse> {
  return withAuth(request, handler, { requiredRole: 'MOTORISTA' }, ...args)
}

// Helper para endpoints que precisam verificar acesso à transportadora
export function checkTransportadoraAccess(
  user: AuthUser,
  transportadoraId: string
): NextResponse | null {
  if (user.transportadoraId !== transportadoraId) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Acesso negado: você não tem permissão para acessar dados desta transportadora' 
      },
      { status: 403 }
    )
  }
  return null
}

// Helper para endpoints que precisam verificar acesso ao motorista
export function checkMotoristaAccess(
  user: AuthUser,
  motoristaId: string
): NextResponse | null {
  // Admin pode acessar qualquer motorista da sua transportadora
  if (user.role === 'ADMIN_TRANSPORTADORA') {
    // Verificação adicional será feita na query do banco
    return null
  }

  // Motorista só pode acessar seus próprios dados
  if (user.role === 'MOTORISTA' && user.motoristaId !== motoristaId) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Acesso negado: você só pode acessar seus próprios dados' 
      },
      { status: 403 }
    )
  }

  return null
}