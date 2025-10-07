import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { StatusViagem } from '@/generated/prisma'

const viagemUpdateSchema = z.object({
  descricao: z.string().min(1).optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().nullable().optional(),
  status: z.nativeEnum(StatusViagem).optional(),
  transportadoraId: z.string().uuid().optional(),
  motoristaId: z.string().uuid().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Nada para atualizar' })

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const v = await prisma.viagem.findUnique({
      where: { id },
      include: {
        transportadora: { select: { id: true, nome: true } },
        motorista: { select: { id: true, nome: true } },
        receitas: true,
        despesas: true,
        acerto: true,
      },
    })
    if (!v) return NextResponse.json({ error: 'Viagem não encontrada' }, { status: 404 })
    const totalReceitas = v.receitas.reduce((s, r) => s + Number(r.valor), 0)
    const totalDespesas = v.despesas.reduce((s, d) => s + Number(d.valor), 0)
    const lucro = totalReceitas - totalDespesas
    return NextResponse.json({ ...v, totalReceitas, totalDespesas, lucro })
  } catch (error) {
    console.error('GET /viagens/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const data = viagemUpdateSchema.parse(body)
    const { id } = await params

    if (data.transportadoraId) {
      const exists = await prisma.transportadora.findUnique({ where: { id: data.transportadoraId } })
      if (!exists) return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 400 })
    }
    if (data.motoristaId) {
      const exists = await prisma.motorista.findUnique({ where: { id: data.motoristaId } })
      if (!exists) return NextResponse.json({ error: 'Motorista não encontrado' }, { status: 400 })
    }

    const dataInicio = data.dataInicio ? new Date(data.dataInicio) : undefined
    const dataFim = data.dataFim === null ? null : data.dataFim ? new Date(data.dataFim) : undefined
    if (dataInicio && dataFim && dataFim <= dataInicio) {
      return NextResponse.json({ error: 'Data de fim deve ser posterior à data de início' }, { status: 400 })
    }

    const viagem = await prisma.viagem.update({
      where: { id },
      data: {
        ...data,
        dataInicio,
        dataFim,
      },
      include: {
        transportadora: { select: { id: true, nome: true } },
        motorista: { select: { id: true, nome: true } },
        receitas: true,
        despesas: true,
        acerto: true,
      },
    })
    return NextResponse.json(viagem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('PUT /viagens/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Regra: pode excluir apenas se não houver receitas, despesas ou acerto
    const v = await prisma.viagem.findUnique({
      where: { id },
      include: { _count: { select: { receitas: true, despesas: true } }, acerto: true },
    })
    if (!v) return NextResponse.json({ error: 'Viagem não encontrada' }, { status: 404 })
    if (v._count.receitas > 0 || v._count.despesas > 0 || v.acerto) {
      return NextResponse.json({ error: 'Não é possível excluir viagem com lançamentos vinculados' }, { status: 400 })
    }
    await prisma.viagem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /viagens/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
