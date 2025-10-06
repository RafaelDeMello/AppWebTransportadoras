import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const receita = await prisma.receita.findUnique({
      where: { id: params.id },
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true
          }
        }
      }
    })

    if (!receita) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Receita não encontrada' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: receita
    })
  } catch (error) {
    console.error('Erro ao buscar receita:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json()

    // Verificar se receita existe
    const existingReceita = await prisma.receita.findUnique({
      where: { id: params.id }
    })

    if (!existingReceita) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Receita não encontrada' 
        },
        { status: 404 }
      )
    }

    // Validar valor se fornecido
    if (data.valor !== undefined) {
      const valorNumerico = parseFloat(data.valor)
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Valor deve ser um número positivo' 
          },
          { status: 400 }
        )
      }
    }

    // Se está alterando viagem, verificar se existe
    if (data.viagemId && data.viagemId !== existingReceita.viagemId) {
      const viagem = await prisma.viagem.findUnique({
        where: { id: data.viagemId }
      })

      if (!viagem) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Viagem não encontrada' 
          },
          { status: 404 }
        )
      }
    }

    const receita = await prisma.receita.update({
      where: { id: params.id },
      data: {
        ...(data.viagemId && { viagemId: data.viagemId }),
        ...(data.valor !== undefined && { valor: parseFloat(data.valor) }),
        ...(data.descricao && { descricao: data.descricao }),
      },
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: receita,
      message: 'Receita atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar receita:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se receita existe
    const existingReceita = await prisma.receita.findUnique({
      where: { id: params.id }
    })

    if (!existingReceita) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Receita não encontrada' 
        },
        { status: 404 }
      )
    }

    await prisma.receita.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Receita excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir receita:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}