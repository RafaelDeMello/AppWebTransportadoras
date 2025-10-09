import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface JWTPayload {
  userId: string
  email: string
  type: 'TRANSPORTADORA' | 'MOTORISTA'
}

export async function GET(request: NextRequest) {
  try {
    // Pegar cookie de autenticação
    const authCookie = request.cookies.get('auth-token')
    if (!authCookie) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar e decodificar JWT
    const decoded = jwt.verify(authCookie.value, JWT_SECRET) as JWTPayload
    
    if (!decoded || !decoded.userId || !decoded.type) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar usuário na tabela usuarios
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.userId },
      include: {
        transportadoras: true,
        motoristas: {
          include: {
            transportadora: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    let userData: {
      id: string
      email: string
      type: 'TRANSPORTADORA' | 'MOTORISTA'
      nome: string
      transportadoraId?: string
      transportadora?: {
        id: string
        nome: string
        cnpj: string
        telefone: string | null
        endereco: string | null
        createdAt: string
      }
      motoristaId?: string
      motorista?: {
        id: string
        nome: string
        cpf: string
        cnh: string | null
        telefone: string | null
        transportadoraId: string
        codigoValidacao: string
        validado: boolean
        createdAt: string
      }
    }

    if (usuario.role === Role.ADMIN_TRANSPORTADORA && usuario.transportadoras) {
      // Usuário é admin de transportadora
      userData = {
        id: usuario.id,
        email: usuario.email,
        type: 'TRANSPORTADORA' as const,
        nome: usuario.transportadoras.nome,
        transportadoraId: usuario.transportadoras.id,
        transportadora: {
          id: usuario.transportadoras.id,
          nome: usuario.transportadoras.nome,
          cnpj: usuario.transportadoras.cnpj,
          telefone: usuario.transportadoras.telefone,
          endereco: usuario.transportadoras.endereco,
          createdAt: usuario.transportadoras.createdAt.toISOString(),
        }
      }
    } else if (usuario.role === Role.MOTORISTA && usuario.motoristas) {
      // Usuário é motorista
      userData = {
        id: usuario.id,
        email: usuario.email,
        type: 'MOTORISTA' as const,
        nome: usuario.motoristas.nome,
        motoristaId: usuario.motoristas.id,
        motorista: {
          id: usuario.motoristas.id,
          nome: usuario.motoristas.nome,
          cpf: usuario.motoristas.cpf,
          cnh: usuario.motoristas.cnh,
          telefone: usuario.motoristas.telefone,
          transportadoraId: usuario.motoristas.transportadoraId,
          codigoValidacao: usuario.motoristas.codigoValidacao || '',
          validado: usuario.motoristas.validado,
          createdAt: usuario.motoristas.createdAt.toISOString(),
        },
        transportadora: {
          ...usuario.motoristas.transportadora,
          createdAt: usuario.motoristas.transportadora.createdAt.toISOString()
        }
      }
    } else {
      return NextResponse.json({ error: 'Tipo de usuário inválido' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: userData
    })

  } catch (error) {
    console.error('GET /api/auth/me error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}