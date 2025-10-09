import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  email: z.string().email(),
  transportadoraId: z.string().uuid(),
  nome: z.string().min(1),
  cpf: z.string().min(11),
  cnh: z.string().optional(),
  telefone: z.string().optional(),
  codigoValidacao: z.string().length(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
  const { email, transportadoraId, nome, cpf, cnh, telefone, codigoValidacao } = data

    // Verificar se transportadora existe
    const transportadora = await prisma.transportadora.findUnique({ where: { id: transportadoraId } })
    if (!transportadora) return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 400 })

    // Verificar se já existe motorista com mesmo CPF ou email
    const motoristaExistente = await prisma.motorista.findFirst({
      where: {
        OR: [
          { cpf },
          { email }
        ]
      }
    })
    if (motoristaExistente) {
      return NextResponse.json({ error: 'Já existe um motorista com este CPF ou email' }, { status: 400 })
    }

  // OBS: Senha não é persistida no modelo de Motorista

    // Criar motorista
    const motorista = await prisma.motorista.create({
      data: {
        nome,
        cpf,
        cnh: cnh || null,
        telefone: telefone || null,
        transportadoraId,
        email,
        codigoValidacao,
        validado: false,
      },
    })

    return NextResponse.json({ success: true, motoristaId: motorista.id })
  } catch (e) {
    console.error('POST /api/auth/register-motorista error:', e)
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
