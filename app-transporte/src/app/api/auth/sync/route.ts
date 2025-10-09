import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

// Garante que exista um registro em `Usuario` para o usuário autenticado no Supabase
export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request)
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    // Se já existir, retorna
  const existing = await prisma.usuarios.findUnique({ where: { supabaseUid: user.id } })
    if (existing) {
      return NextResponse.json({ success: true, usuarioId: existing.id })
    }

    // Por ora, cadastramos como ADMIN_TRANSPORTADORA sem vincular a transportadora
    const novo = await prisma.usuarios.create({
      data: {
        id: user.id,
        email: user.email || '',
        senhaHash: '-', // placeholder: autenticação via Supabase
        role: Role.ADMIN_TRANSPORTADORA,
        supabaseUid: user.id,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, usuarioId: novo.id })
  } catch (e) {
    console.error('POST /api/auth/sync error:', e)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
