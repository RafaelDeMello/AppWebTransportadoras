import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const receitaUpdateSchema = z.object({
  viagemId: z.string().uuid().optional(),
  valor: z.number().positive().optional(),
  descricao: z.string().min(1).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Nada para atualizar' })

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const receita = await prisma.receita.findUnique({
      where: { id },
      include: {
        viagem: {
          select: {
            id: true,
            descricao: true,
            transportadora: { select: { id: true, nome: true } },
            motorista: { select: { id: true, nome: true } },
          },
        },
      },
    })
    if (!receita) return NextResponse.json({ error: 'Receita não encontrada' }, { status: 404 })
    return NextResponse.json(receita)
  } catch (error) {
    console.error('GET /receitas/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const data = receitaUpdateSchema.parse(body)
    const { id } = await params

    if (data.viagemId) {
      const viagem = await prisma.viagem.findUnique({ where: { id: data.viagemId } })
      if (!viagem) return NextResponse.json({ error: 'Viagem não encontrada' }, { status: 400 })
    }

    const receita = await prisma.receita.update({
      where: { id },
      data,
      include: {
        viagem: {
          select: {
            id: true,
            descricao: true,
            transportadora: { select: { id: true, nome: true } },
            motorista: { select: { id: true, nome: true } },
          },
        },
      },
    })
    return NextResponse.json(receita)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('PUT /receitas/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.receita.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /receitas/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
