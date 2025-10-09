import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

const schema = z.object({
  email: z.string().email(),
  nome: z.string().min(3),
  tipo: z.enum(['ADMIN', 'TRANSPORTADORA']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const { supabase } = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await prisma.usuarios.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    // Criar usuário na tabela Usuario
    const usuario = await prisma.usuarios.create({
      data: {
        id: user.id, // usar o UID do Supabase como id do usuário
        email: data.email,
        senhaHash: '-', // placeholder: usamos Supabase para autenticação
        role: Role.ADMIN_TRANSPORTADORA, // Sempre será admin da transportadora
        supabaseUid: user.id,
        updatedAt: new Date(),
      },
    })

    // Se for TRANSPORTADORA, criar registro na tabela Transportadora
    if (data.tipo === 'TRANSPORTADORA') {
      const transportadora = await prisma.transportadora.create({
        data: {
          nome: data.nome,
          cnpj: '', // Placeholder - pode ser preenchido depois
          email: data.email,
        },
      })

      // Atualizar usuário com transportadoraId
      await prisma.usuarios.update({
        where: { id: usuario.id },
        data: { transportadoraId: transportadora.id },
      })
    }

    return NextResponse.json({ 
      success: true, 
      usuarioId: usuario.id,
      tipo: data.tipo 
    })
  } catch (e) {
    console.error('POST /api/auth/register-admin-transportadora error:', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: e.issues }, 
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}