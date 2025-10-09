import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    const { email, senha } = data

    // 1. Buscar primeiro na tabela Transportadora
    const transportadora = await prisma.transportadora.findUnique({
      where: { email }
    })

    if (transportadora) {
      // Verificar senha da transportadora
      const senhaValida = await bcrypt.compare(senha, transportadora.senhaHash)
      if (!senhaValida) {
        return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 })
      }

      // Gerar JWT para transportadora
      const token = jwt.sign({
        id: transportadora.id,
        email: transportadora.email,
        type: 'TRANSPORTADORA',
        data: {
          transportadoraId: transportadora.id,
          nome: transportadora.nome,
          cnpj: transportadora.cnpj
        }
      }, JWT_SECRET, { expiresIn: '7d' })

      // Criar resposta com cookie
      const response = NextResponse.json({
        success: true,
        user: {
          id: transportadora.id,
          email: transportadora.email,
          type: 'TRANSPORTADORA',
          nome: transportadora.nome,
          transportadoraId: transportadora.id
        },
        redirectTo: '/dashboard'
      })

      // Definir cookie seguro
      response.cookies.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 dias
        path: '/'
      })

      return response
    }

    // 2. Se não encontrou transportadora, buscar na tabela Motorista
    const motorista = await prisma.motorista.findUnique({
      where: { email },
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
      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 })
    }

    // Verificar senha do motorista
    const senhaValida = await bcrypt.compare(senha, motorista.senhaHash)
    if (!senhaValida) {
      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 })
    }

    // Verificar se motorista está validado
    if (!motorista.validado) {
      return NextResponse.json({ 
        error: 'Motorista ainda não validado. Entre em contato com sua transportadora.' 
      }, { status: 403 })
    }

    // Gerar JWT para motorista
    const token = jwt.sign({
      id: motorista.id,
      email: motorista.email,
      type: 'MOTORISTA',
      data: {
        motoristaId: motorista.id,
        nome: motorista.nome,
        cpf: motorista.cpf,
        transportadoraId: motorista.transportadoraId,
        validado: motorista.validado
      }
    }, JWT_SECRET, { expiresIn: '7d' })

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: motorista.id,
        email: motorista.email,
        type: 'MOTORISTA',
        nome: motorista.nome,
        motoristaId: motorista.id,
        transportadoraId: motorista.transportadoraId,
        transportadora: motorista.transportadora
      },
      redirectTo: '/viagens'
    })

    // Definir cookie seguro
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/'
    })

    return response

  } catch (e) {
    console.error('POST /api/auth/login error:', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: e.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}