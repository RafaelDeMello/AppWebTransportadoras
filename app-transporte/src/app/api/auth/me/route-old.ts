import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface JWTPayload {
  id: string
  email: string
  type: 'TRANSPORTADORA' | 'MOTORISTA'
  data: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  try {
    // Pegar cookie de sessão
    const sessionCookie = request.cookies.get('session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar e decodificar JWT
    const decoded = jwt.verify(sessionCookie.value, JWT_SECRET) as JWTPayload
    
    if (!decoded || !decoded.id || !decoded.type) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados atualizados do usuário
    if (decoded.type === 'TRANSPORTADORA') {
      const transportadora = await prisma.transportadora.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          nome: true,
          email: true,
          cnpj: true,
          telefone: true,
          endereco: true,
          createdAt: true
        }
      })

      if (!transportadora) {
        return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: transportadora.id,
          email: transportadora.email,
          type: 'TRANSPORTADORA',
          nome: transportadora.nome,
          transportadoraId: transportadora.id,
          transportadora: transportadora
        }
      })
    } 
    
    else if (decoded.type === 'MOTORISTA') {
      const motorista = await prisma.motorista.findUnique({
        where: { id: decoded.id },
        include: {
          transportadora: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      })

      if (!motorista) {
        return NextResponse.json({ error: 'Motorista não encontrado' }, { status: 404 })
      }

      if (!motorista.validado) {
        return NextResponse.json({ 
          error: 'Motorista não validado' 
        }, { status: 403 })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: motorista.id,
          email: motorista.email,
          type: 'MOTORISTA',
          nome: motorista.nome,
          motoristaId: motorista.id,
          transportadoraId: motorista.transportadoraId,
          motorista: motorista,
          transportadora: motorista.transportadora
        }
      })
    }

    return NextResponse.json({ error: 'Tipo de usuário inválido' }, { status: 400 })

  } catch (e) {
    console.error('GET /api/auth/me error:', e)
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
