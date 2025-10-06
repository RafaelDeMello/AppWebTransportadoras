import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const acerto = await prisma.acerto.findUnique({
      where: { id: params.id },
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true,
            receitas: true,
            despesas: true
          }
        }
      }
    })

    if (!acerto) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acerto não encontrado' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: acerto
    })
  } catch (error) {
    console.error('Erro ao buscar acerto:', error)
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

    // Verificar se acerto existe
    const existingAcerto = await prisma.acerto.findUnique({
      where: { id: params.id }
    })

    if (!existingAcerto) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acerto não encontrado' 
        },
        { status: 404 }
      )
    }

    const acerto = await prisma.acerto.update({
      where: { id: params.id },
      data: {
        ...(data.pago !== undefined && { pago: Boolean(data.pago) }),
        // Não permitir alterar valor e viagemId diretamente
        // O valor deve ser recalculado se necessário
      },
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true,
            receitas: true,
            despesas: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: acerto,
      message: 'Acerto atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar acerto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// Endpoint especial para recalcular o valor do acerto
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se acerto existe
    const existingAcerto = await prisma.acerto.findUnique({
      where: { id: params.id },
      include: {
        viagem: {
          include: {
            receitas: true,
            despesas: true
          }
        }
      }
    })

    if (!existingAcerto) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acerto não encontrado' 
        },
        { status: 404 }
      )
    }

    // Recalcular o valor
    const totalReceitas = existingAcerto.viagem.receitas.reduce((sum, receita) => {
      return sum + Number(receita.valor)
    }, 0)

    const totalDespesas = existingAcerto.viagem.despesas.reduce((sum, despesa) => {
      return sum + Number(despesa.valor)
    }, 0)

    const valorAcerto = totalReceitas - totalDespesas

    // Atualizar acerto com novo valor
    const acerto = await prisma.acerto.update({
      where: { id: params.id },
      data: {
        valor: valorAcerto
      },
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true,
            receitas: true,
            despesas: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: acerto,
      message: 'Acerto recalculado com sucesso',
      calculado: {
        totalReceitas,
        totalDespesas,
        valorAcerto
      }
    })
  } catch (error) {
    console.error('Erro ao recalcular acerto:', error)
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
    // Verificar se acerto existe
    const existingAcerto = await prisma.acerto.findUnique({
      where: { id: params.id }
    })

    if (!existingAcerto) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acerto não encontrado' 
        },
        { status: 404 }
      )
    }

    await prisma.acerto.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Acerto excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir acerto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}