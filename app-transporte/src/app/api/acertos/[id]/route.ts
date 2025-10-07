import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const acertoUpdateSchema = z.object({
  viagemId: z.string().uuid().optional(),
  valor: z.number().optional(),
  pago: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const acerto = await prisma.acerto.findUnique({
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

    if (!acerto) {
      return NextResponse.json({ error: 'Acerto não encontrado' }, { status: 404 })
    }

    return NextResponse.json(acerto)
  } catch (error) {
    console.error('GET /acertos/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const data = acertoUpdateSchema.parse(body)
    const { id } = await params

    // Se trocar viagem, validar existência e unicidade do acerto por viagem
    if (data.viagemId) {
      const viagem = await prisma.viagem.findUnique({ where: { id: data.viagemId } })
      if (!viagem) {
        return NextResponse.json({ error: 'Viagem não encontrada' }, { status: 400 })
      }
      const existing = await prisma.acerto.findUnique({ where: { viagemId: data.viagemId } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Já existe acerto para esta viagem' }, { status: 400 })
      }
    }

    const acerto = await prisma.acerto.update({
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

    return NextResponse.json(acerto)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('PUT /acertos/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.acerto.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /acertos/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
