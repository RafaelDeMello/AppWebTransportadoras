import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    console.log('🟢 [LOGIN_API] Iniciando processo de login...')
    
    const body = await request.json()
    console.log('🟢 [LOGIN_API] Body recebido:', { ...body, senha: '[REDACTED]' })
    
    const data = schema.parse(body)
    const { email, senha } = data
    console.log('🟢 [LOGIN_API] Dados validados - Email:', email)

    // Buscar usuário na tabela usuarios
    console.log('🟢 [LOGIN_API] Buscando usuário no banco...')
    const usuario = await prisma.usuarios.findUnique({
      where: { email },
      include: {
        transportadoras: true,
        motoristas: {
          include: {
            transportadora: true
          }
        }
      }
    })

    console.log('🟢 [LOGIN_API] Usuário encontrado:', usuario ? 'SIM' : 'NÃO')
    
    if (!usuario) {
      console.log('❌ [LOGIN_API] Usuário não encontrado')
      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 })
    }

    console.log('🟢 [LOGIN_API] Verificando senha...')
    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash)
    console.log('🟢 [LOGIN_API] Senha válida:', senhaValida)
    
    if (!senhaValida) {
      console.log('❌ [LOGIN_API] Senha inválida')
      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 })
    }

    console.log('🟢 [LOGIN_API] Montando dados do usuário...')
    console.log('🟢 [LOGIN_API] Role do usuário:', usuario.role)
    
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
    let userType: 'TRANSPORTADORA' | 'MOTORISTA'

    if (usuario.role === Role.ADMIN_TRANSPORTADORA && usuario.transportadoras) {
      // Usuário é admin de transportadora
      userType = 'TRANSPORTADORA'
      userData = {
        id: usuario.id,
        email: usuario.email,
        type: userType,
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
      userType = 'MOTORISTA'
      userData = {
        id: usuario.id,
        email: usuario.email,
        type: userType,
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
      console.log('❌ [LOGIN_API] Tipo de usuário inválido')
      return NextResponse.json({ error: 'Tipo de usuário inválido' }, { status: 400 })
    }

    console.log('🟢 [LOGIN_API] Gerando JWT...')
    console.log('🟢 [LOGIN_API] Payload para JWT:', { userId: usuario.id, email: usuario.email, type: userType })
    console.log('🟢 [LOGIN_API] JWT_SECRET:', JWT_SECRET ? 'DEFINIDA' : 'UNDEFINED')
    
    // Gerar JWT
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        email: usuario.email, 
        type: userType 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    console.log('🟢 [LOGIN_API] Token gerado (primeiros 20 chars):', token.substring(0, 20) + '...')

    console.log('🟢 [LOGIN_API] Configurando cookie e resposta...')
    // Configurar cookie
    const response = NextResponse.json({ 
      success: true, 
      user: userData 
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })

    console.log('✅ [LOGIN_API] Login concluído com sucesso!')
    return response
  } catch (e) {
    console.error('POST /api/auth/login error:', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos' }, 
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}