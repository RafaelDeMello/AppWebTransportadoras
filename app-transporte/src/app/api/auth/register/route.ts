import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum(['TRANSPORTADORA', 'MOTORISTA']),
  // Para motoristas
  cpf: z.string().optional(),
  cnh: z.string().optional(),
  telefone: z.string().optional(),
  transportadoraId: z.string().optional(),
  // Para transportadoras
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando registro...')
    const body = await request.json()
    console.log('Body recebido:', { ...body, password: '[REDACTED]' })
    
    const data = schema.parse(body)
    console.log('Data validada:', { ...data, password: '[REDACTED]' })

    // Verificar se já existe um usuário com este email
    console.log('Verificando email existente...')
    const existingUser = await prisma.usuarios.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      console.log('Email já existe')
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    // Hash da senha
    console.log('Fazendo hash da senha...')
    const senhaHash = await bcrypt.hash(data.password, 12)
    console.log('Hash concluído')

    let userId: string
    let userData: any

    if (data.type === 'TRANSPORTADORA') {
      console.log('Criando transportadora...')
      // Criar transportadora
      const transportadora = await prisma.transportadora.create({
        data: {
          nome: data.nome,
          cnpj: data.cnpj || '',
          email: data.email,
          telefone: data.telefone || null,
          endereco: data.endereco || null,
        },
      })

      console.log('Criando usuário para transportadora...')
      // Criar usuário
      const usuario = await prisma.usuarios.create({
        data: {
          id: transportadora.id,
          email: data.email,
          senhaHash,
          role: Role.ADMIN_TRANSPORTADORA,
          transportadoraId: transportadora.id,
          supabaseUid: transportadora.id, // Usar o ID da transportadora como supabaseUid
          updatedAt: new Date(),
        },
      })

      userId = usuario.id
      userData = {
        id: transportadora.id,
        email: data.email,
        type: 'TRANSPORTADORA' as const,
        nome: transportadora.nome,
        transportadoraId: transportadora.id,
        transportadora: {
          id: transportadora.id,
          nome: transportadora.nome,
          cnpj: transportadora.cnpj,
          telefone: transportadora.telefone,
          endereco: transportadora.endereco,
          createdAt: transportadora.createdAt.toISOString(),
        }
      }
    } else {
      // Para motoristas, precisa de transportadoraId
      if (!data.transportadoraId) {
        return NextResponse.json({ error: 'ID da transportadora é obrigatório para motoristas' }, { status: 400 })
      }

      console.log('Verificando transportadora...')
      // Verificar se a transportadora existe
      const transportadora = await prisma.transportadora.findUnique({
        where: { id: data.transportadoraId }
      })

      if (!transportadora) {
        return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 400 })
      }

      console.log('Criando motorista...')
      // Gerar código de validação
      const codigoValidacao = Math.random().toString(36).substring(2, 8).toUpperCase()

      // Criar motorista
      const motorista = await prisma.motorista.create({
        data: {
          nome: data.nome,
          cpf: data.cpf || '',
          cnh: data.cnh || null,
          telefone: data.telefone || null,
          transportadoraId: data.transportadoraId,
          codigoValidacao,
          validado: false,
        },
      })

      console.log('Criando usuário para motorista...')
      // Criar usuário
      const usuario = await prisma.usuarios.create({
        data: {
          id: motorista.id,
          email: data.email,
          senhaHash,
          role: Role.MOTORISTA,
          motoristaId: motorista.id,
          supabaseUid: motorista.id, // Usar o ID do motorista como supabaseUid
          updatedAt: new Date(),
        },
      })

      userId = usuario.id
      userData = {
        id: motorista.id,
        email: data.email,
        type: 'MOTORISTA' as const,
        nome: motorista.nome,
        motoristaId: motorista.id,
        motorista: {
          id: motorista.id,
          nome: motorista.nome,
          cpf: motorista.cpf,
          cnh: motorista.cnh,
          telefone: motorista.telefone,
          transportadoraId: motorista.transportadoraId,
          codigoValidacao: motorista.codigoValidacao || '',
          validado: motorista.validado,
          createdAt: motorista.createdAt.toISOString(),
        }
      }
    }

    console.log('Gerando JWT...')
    // Gerar JWT
    const token = jwt.sign(
      { 
        userId, 
        email: data.email, 
        type: data.type 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    console.log('Configurando cookie...')
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

    console.log('Registro concluído com sucesso')
    return response
  } catch (e) {
    console.error('POST /api/auth/register error:', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0].message }, 
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}