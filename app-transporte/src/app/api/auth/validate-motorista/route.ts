import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'

const schema = z.object({
  cpf: z.string().min(11),
  codigoValidacao: z.string().min(6).max(6),
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

    // Buscar motorista pelo CPF e código de validação
    const motorista = await prisma.motorista.findFirst({
      where: {
        cpf: data.cpf,
        codigoValidacao: data.codigoValidacao,
        validado: false, // Só pode validar uma vez
      },
      include: {
        transportadora: true,
      }
    })

    if (!motorista) {
      return NextResponse.json(
        { error: 'CPF ou código de validação inválido, ou motorista já validado' }, 
        { status: 400 }
      )
    }

    // Atualizar motorista como validado
    await prisma.motorista.update({
      where: { id: motorista.id },
      data: { validado: true }
    })

    // Criar ou atualizar usuário na tabela Usuario
    const existing = await prisma.usuario.findUnique({ 
      where: { supabaseUid: user.id } 
    })
    
    const usuario = existing
      ? await prisma.usuario.update({
          where: { id: existing.id },
          data: { 
            role: Role.MOTORISTA, 
            transportadoraId: motorista.transportadoraId, 
            motoristaId: motorista.id 
          },
        })
      : await prisma.usuario.create({
          data: {
            email: user.email,
            senhaHash: '-', // placeholder: usamos Supabase para autenticação
            role: Role.MOTORISTA,
            transportadoraId: motorista.transportadoraId,
            motoristaId: motorista.id,
            supabaseUid: user.id,
          },
        })

    return NextResponse.json({ 
      success: true, 
      motoristaId: motorista.id, 
      transportadoraId: motorista.transportadoraId,
      usuarioId: usuario.id 
    })
  } catch (e) {
    console.error('POST /api/auth/validate-motorista error:', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: e.issues }, 
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}