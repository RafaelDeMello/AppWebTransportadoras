import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

const schema = z.object({
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

    const { supabase } = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const transportadora = await prisma.transportadora.findUnique({ where: { id: data.transportadoraId } })
    if (!transportadora) return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 400 })

    const motorista = await prisma.motorista.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        cnh: data.cnh || null,
        telefone: data.telefone || null,
        transportadoraId: data.transportadoraId,
      },
    })

    const existing = await prisma.usuario.findUnique({ where: { supabaseUid: user.id } })
    const usuario = existing
      ? await prisma.usuario.update({
          where: { id: existing.id },
          data: { role: Role.MOTORISTA, transportadoraId: data.transportadoraId, motoristaId: motorista.id },
        })
      : await prisma.usuario.create({
          data: {
            email: user.email,
            senhaHash: '-',
            role: Role.MOTORISTA,
            transportadoraId: data.transportadoraId,
            motoristaId: motorista.id,
            supabaseUid: user.id,
          },
        })

    return NextResponse.json({ success: true, motoristaId: motorista.id, usuarioId: usuario.id })
  } catch (e) {
    console.error('POST /api/auth/register-motorista error:', e)
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
