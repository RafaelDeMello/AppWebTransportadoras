import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const motorista = await prisma.motorista.findUnique({
      where: { id: params.id },
      include: {
        transportadora: true,
        usuarios: true,
        viagens: {
          include: {
            receitas: true,
            despesas: true,
            acerto: true
          }
        }
      }
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

    return NextResponse.json({
      success: true,
      data: motorista
    })
  } catch (error) {
    console.error('Erro ao buscar motorista:', error)
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

    // Verificar se motorista existe
    const existingMotorista = await prisma.motorista.findUnique({
      where: { id: params.id }
    })

    if (!existingMotorista) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Motorista não encontrado' 
        },
        { status: 404 }
      )
    }

    // Se está alterando CPF, verificar se já existe
    if (data.cpf && data.cpf !== existingMotorista.cpf) {
      const cpfExists = await prisma.motorista.findUnique({
        where: { cpf: data.cpf }
      })

      if (cpfExists) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'CPF já está cadastrado' 
          },
          { status: 409 }
        )
      }
    }

    // Se está alterando transportadora, verificar se existe
    if (data.transportadoraId && data.transportadoraId !== existingMotorista.transportadoraId) {
      const transportadora = await prisma.transportadora.findUnique({
        where: { id: data.transportadoraId }
      })

      if (!transportadora) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Transportadora não encontrada' 
          },
          { status: 404 }
        )
      }
    }

    const motorista = await prisma.motorista.update({
      where: { id: params.id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.cpf && { cpf: data.cpf }),
        ...(data.cnh && { cnh: data.cnh }),
        ...(data.telefone && { telefone: data.telefone }),
        ...(data.transportadoraId && { transportadoraId: data.transportadoraId }),
      },
      include: {
        transportadora: true
      }
    })

    return NextResponse.json({
      success: true,
      data: motorista,
      message: 'Motorista atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar motorista:', error)
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
    // Verificar se motorista existe
    const existingMotorista = await prisma.motorista.findUnique({
      where: { id: params.id }
    })

    if (!existingMotorista) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Motorista não encontrado' 
        },
        { status: 404 }
      )
    }

    // Verificar se tem viagens vinculadas
    const hasViagens = await prisma.viagem.findFirst({
      where: { motoristaId: params.id }
    })

    if (hasViagens) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir motorista com viagens vinculadas' 
        },
        { status: 400 }
      )
    }

    await prisma.motorista.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Motorista excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir motorista:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}