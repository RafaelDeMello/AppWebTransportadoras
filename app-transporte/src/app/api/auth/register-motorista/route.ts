import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
  transportadoraId: z.string().uuid(),
  nome: z.string().min(1),
  cpf: z.string().min(11),
  cnh: z.string().optional(),
  telefone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    const { email, senha, transportadoraId, nome, cpf, cnh, telefone } = data

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

    // Verificar se transportadora existe
    const transportadora = await prisma.transportadora.findUnique({ where: { id: transportadoraId } })
    if (!transportadora) return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 400 })

    // Fluxo original: cria motorista e usuário sem obrigatoriedade rígida
    const motorista = await prisma.motorista.create({
      data: {
        nome,
        cpf,
        cnh: cnh || null,
        telefone: telefone || null,
        transportadoraId,
      },
    })

    const existing = await prisma.usuario.findUnique({ where: { supabaseUid } })
    const usuario = existing
      ? await prisma.usuario.update({
          where: { id: existing.id },
          data: { role: Role.MOTORISTA, transportadoraId, motoristaId: motorista.id },
        })
      : await prisma.usuario.create({
          data: {
            email,
            senhaHash: '-',
            role: Role.MOTORISTA,
            transportadoraId,
            motoristaId: motorista.id,
            supabaseUid,
          },
        })

    // Autenticar automaticamente
    await supabase.auth.signInWithPassword({ email, password: senha })

    return NextResponse.json({ success: true, motoristaId: motorista.id, usuarioId: usuario.id })
  } catch (e) {
    console.error('POST /api/auth/register-motorista error:', e)
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
