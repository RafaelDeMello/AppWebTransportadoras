import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transportadora = await prisma.transportadora.findUnique({
      where: { id: params.id },
      include: {
        usuarios: true,
        motoristas: true,
        viagens: {
          include: {
            motorista: true,
            receitas: true,
            despesas: true,
            acerto: true
          }
        }
      }
    })

    if (!transportadora) {
      return NextResponse.json(
        { error: 'Transportadora não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(transportadora)
  } catch (error) {
    console.error('Erro ao buscar transportadora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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

    // Verificar se transportadora existe
    const existingTransportadora = await prisma.transportadora.findUnique({
      where: { id: params.id }
    })

    if (!existingTransportadora) {
      return NextResponse.json(
        { error: 'Transportadora não encontrada' },
        { status: 404 }
      )
    }

    // Se está alterando CNPJ, verificar se já existe
    if (data.cnpj && data.cnpj !== existingTransportadora.cnpj) {
      const cnpjExists = await prisma.transportadora.findUnique({
        where: { cnpj: data.cnpj }
      })

      if (cnpjExists) {
        return NextResponse.json(
          { error: 'CNPJ já está cadastrado' },
          { status: 409 }
        )
      }
    }

    const transportadora = await prisma.transportadora.update({
      where: { id: params.id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.cnpj && { cnpj: data.cnpj }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.telefone !== undefined && { telefone: data.telefone }),
        ...(data.endereco !== undefined && { endereco: data.endereco }),
      }
    })

    return NextResponse.json(transportadora)
  } catch (error) {
    console.error('Erro ao atualizar transportadora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se transportadora existe
    const existingTransportadora = await prisma.transportadora.findUnique({
      where: { id: params.id }
    })

    if (!existingTransportadora) {
      return NextResponse.json(
        { error: 'Transportadora não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se tem dependências (usuários, motoristas, viagens)
    const hasUsers = await prisma.usuario.findFirst({
      where: { transportadoraId: params.id }
    })

    const hasMotoristas = await prisma.motorista.findFirst({
      where: { transportadoraId: params.id }
    })

    if (hasUsers || hasMotoristas) {
      return NextResponse.json(
        { error: 'Não é possível excluir transportadora com usuários ou motoristas vinculados' },
        { status: 400 }
      )
    }

    await prisma.transportadora.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Transportadora excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir transportadora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}