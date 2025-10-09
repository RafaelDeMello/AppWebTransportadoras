import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(1),
  cnpj: z.string().min(11),
  email: z.string().email(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
  const { nome, cnpj, email, telefone, endereco } = data

    // Verifica se já existe transportadora com esse email ou CNPJ
    const exists = await prisma.transportadora.findFirst({
      where: { OR: [{ email }, { cnpj }] }
    })
    if (exists) {
      return NextResponse.json({ error: 'Transportadora já cadastrada' }, { status: 400 })
    }

  // OBS: Senha não é persistida no modelo de Transportadora

    // Cria transportadora
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
    console.error('POST /api/auth/register-transportadora error:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
