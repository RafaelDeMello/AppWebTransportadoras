import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const despesa = await prisma.despesa.findUnique({
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

    if (!despesa) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Despesa não encontrada' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: despesa
    })
  } catch (error) {
    console.error('Erro ao buscar despesa:', error)
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

    // Verificar se despesa existe
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id: params.id }
    })

    if (!existingDespesa) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Despesa não encontrada' 
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
    if (data.viagemId && data.viagemId !== existingDespesa.viagemId) {
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

    const despesa = await prisma.despesa.update({
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
      data: despesa,
      message: 'Despesa atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error)
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
    // Verificar se despesa existe
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id: params.id }
    })

    if (!existingDespesa) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Despesa não encontrada' 
        },
        { status: 404 }
      )
    }

    await prisma.despesa.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Despesa excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir despesa:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}