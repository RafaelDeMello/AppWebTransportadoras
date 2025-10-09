import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  nome: z.string().min(1),
  cnpj: z.string().min(11),
  email: z.string().email(),
  senha: z.string().min(6),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
  const { nome, cnpj, email, telefone, endereco } = data

    // Verificar se já existe transportadora com mesmo CNPJ ou email
    const transportadoraExistente = await prisma.transportadora.findFirst({
      where: {
        OR: [
          { cnpj },
          { email }
        ]
      }
    })
    if (transportadoraExistente) {
      return NextResponse.json({ error: 'Já existe uma transportadora com este CNPJ ou email' }, { status: 400 })
    }

  // OBS: Este endpoint não persiste senha no modelo de Transportadora.

    // Criar transportadora
    const transportadora = await prisma.transportadora.create({
      data: {
        nome,
        cnpj,
        email,
        telefone,
        endereco,
      },
    })

    return NextResponse.json({ success: true, transportadoraId: transportadora.id })
  } catch (e) {
    console.error('POST /api/auth/register-admin error:', e)
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
