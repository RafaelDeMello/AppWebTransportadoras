import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

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
    const { nome, cnpj, email, senha, telefone, endereco } = data

    // Verifica se já existe transportadora com esse email ou CNPJ
    const exists = await prisma.transportadora.findFirst({
      where: { OR: [{ email }, { cnpj }] }
    })
    if (exists) {
      return NextResponse.json({ error: 'Transportadora já cadastrada' }, { status: 400 })
    }

    // Gera hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    // Cria transportadora
    const transportadora = await prisma.transportadora.create({
      data: {
        nome,
        cnpj,
        email,
        senhaHash,
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
