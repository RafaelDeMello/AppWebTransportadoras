import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
  transportadoraNome: z.string().min(1),
  transportadoraCnpj: z.string().min(11),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    const { email, senha, transportadoraNome, transportadoraCnpj } = data

    const { supabase } = createClient(request)
    // Criar usuário no Supabase
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: senha
    })
    if (signUpError || !signUpData.user) {
      return NextResponse.json({ error: 'Erro ao criar usuário no Supabase', details: signUpError?.message }, { status: 400 })
    }
    const supabaseUid = signUpData.user.id

    // Verificar se já existe usuário com esse UID
    const existing = await prisma.usuario.findUnique({ where: { supabaseUid } })
    if (existing?.transportadoraId) {
      return NextResponse.json({ error: 'Usuário já possui transportadora vinculada' }, { status: 400 })
    }

    // Criar transportadora primeiro
    const transportadora = await prisma.transportadora.create({
      data: {
        nome: transportadoraNome,
        cnpj: transportadoraCnpj,
        email,
      },
    })

    // Criar usuário já vinculado à transportadora
    const usuario = await prisma.usuario.create({
      data: {
        email,
        senhaHash: '-',
        role: Role.ADMIN_TRANSPORTADORA,
        transportadoraId: transportadora.id,
        supabaseUid,
      },
    })

    // Autenticar automaticamente (não impede cadastro em caso de erro)
    try {
      await supabase.auth.signInWithPassword({ email, password: senha })
    } catch (authError) {
      console.error('Erro na autenticação automática:', authError)
      // Não retorna erro, apenas loga
    }

    // Retorna sucesso independentemente da autenticação automática
    return NextResponse.json({ success: true, transportadoraId: transportadora.id, usuarioId: usuario.id })
  } catch (e) {
    console.error('POST /api/auth/register-admin error:', e)
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
