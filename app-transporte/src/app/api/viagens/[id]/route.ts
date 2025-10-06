import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const viagem = await prisma.viagem.findUnique({
      where: { id: params.id },
      include: {
        transportadora: true,
        motorista: true,
        receitas: true,
        despesas: true,
        acerto: true
      }
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

    return NextResponse.json({
      success: true,
      data: viagem
    })
  } catch (error) {
    console.error('Erro ao buscar viagem:', error)
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

    // Verificar se viagem existe
    const existingViagem = await prisma.viagem.findUnique({
      where: { id: params.id }
    })

    if (!existingViagem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Viagem não encontrada' 
        },
        { status: 404 }
      )
    }

    // Se está alterando motorista, verificar se existe e pertence à transportadora
    if (data.motoristaId && data.motoristaId !== existingViagem.motoristaId) {
      const motorista = await prisma.motorista.findUnique({
        where: { id: data.motoristaId }
      })

      if (!motorista) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Motorista não encontrado' 
          },
          { status: 404 }
        )
      }

      if (motorista.transportadoraId !== existingViagem.transportadoraId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Motorista não pertence a esta transportadora' 
          },
          { status: 400 }
        )
      }
    }

    const viagem = await prisma.viagem.update({
      where: { id: params.id },
      data: {
        ...(data.descricao && { descricao: data.descricao }),
        ...(data.dataInicio && { dataInicio: new Date(data.dataInicio) }),
        ...(data.dataFim !== undefined && { 
          dataFim: data.dataFim ? new Date(data.dataFim) : null 
        }),
        ...(data.status && { status: data.status }),
        ...(data.motoristaId && { motoristaId: data.motoristaId }),
      },
      include: {
        transportadora: true,
        motorista: true,
        receitas: true,
        despesas: true,
        acerto: true
      }
    })

    return NextResponse.json({
      success: true,
      data: viagem,
      message: 'Viagem atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar viagem:', error)
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
    // Verificar se viagem existe
    const existingViagem = await prisma.viagem.findUnique({
      where: { id: params.id },
      include: {
        receitas: true,
        despesas: true,
        acerto: true
      }
    })

    if (!existingViagem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Viagem não encontrada' 
        },
        { status: 404 }
      )
    }

    // Verificar se tem receitas, despesas ou acerto vinculados
    if (existingViagem.receitas.length > 0 || existingViagem.despesas.length > 0 || existingViagem.acerto) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir viagem com receitas, despesas ou acerto vinculados' 
        },
        { status: 400 }
      )
    }

    await prisma.viagem.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Viagem excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir viagem:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}