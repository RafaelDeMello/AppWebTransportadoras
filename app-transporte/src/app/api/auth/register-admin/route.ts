import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

const schema = z.object({
  transportadoraNome: z.string().min(1),
  transportadoraCnpj: z.string().min(11),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const { supabase } = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const existing = await prisma.usuario.findUnique({ where: { supabaseUid: user.id } })
    if (existing?.transportadoraId) {
      return NextResponse.json({ error: 'Usuário já possui transportadora vinculada' }, { status: 400 })
    }

    // Criar transportadora e vincular usuário como ADMIN
    const transportadora = await prisma.transportadora.create({
      data: {
        nome: data.transportadoraNome,
        cnpj: data.transportadoraCnpj,
        email: user.email,
      },
    })

    const usuario = existing
      ? await prisma.usuario.update({
          where: { id: existing.id },
          data: { role: Role.ADMIN_TRANSPORTADORA, transportadoraId: transportadora.id },
        })
      : await prisma.usuario.create({
          data: {
            email: user.email,
            senhaHash: '-',
            role: Role.ADMIN_TRANSPORTADORA,
            transportadoraId: transportadora.id,
            supabaseUid: user.id,
          },
        })

    return NextResponse.json({ success: true, transportadoraId: transportadora.id, usuarioId: usuario.id })
  } catch (e) {
    console.error('POST /api/auth/register-admin error:', e)
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
