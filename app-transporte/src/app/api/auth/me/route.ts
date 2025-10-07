import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const usuario = await prisma.usuario.findUnique({
      where: { supabaseUid: user.id },
      include: {
        transportadora: true,
        motorista: true,
      },
    })
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    return NextResponse.json({
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
      transportadora: usuario.transportadora ? {
        id: usuario.transportadora.id,
        nome: usuario.transportadora.nome,
        cnpj: usuario.transportadora.cnpj,
      } : null,
      motorista: usuario.motorista ? {
        id: usuario.motorista.id,
        nome: usuario.motorista.nome,
        cpf: usuario.motorista.cpf,
      } : null,
    })
  } catch (e) {
    console.error('GET /api/auth/me error:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
