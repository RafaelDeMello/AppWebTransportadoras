import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const viagens = await prisma.viagem.findMany({
      include: {
        transportadora: true,
        motorista: true,
        receitas: true,
        despesas: true,
        acerto: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: viagens,
      total: viagens.length
    })
  } catch (error) {
    console.error('Erro ao buscar viagens:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Validação básica
    if (!data.descricao || !data.dataInicio || !data.transportadoraId || !data.motoristaId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Descrição, data de início, transportadoraId e motoristaId são obrigatórios' 
        },
        { status: 400 }
      )
    }

    // Verificar se transportadora existe
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

    // Verificar se motorista existe
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

    // Verificar se motorista pertence à transportadora
    if (motorista.transportadoraId !== data.transportadoraId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Motorista não pertence a esta transportadora' 
        },
        { status: 400 }
      )
    }

    // Criar viagem
    const viagem = await prisma.viagem.create({
      data: {
        descricao: data.descricao,
        dataInicio: new Date(data.dataInicio),
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
        status: data.status || 'PLANEJADA',
        transportadoraId: data.transportadoraId,
        motoristaId: data.motoristaId
      },
      include: {
        transportadora: true,
        motorista: true
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: viagem,
        message: 'Viagem criada com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar viagem:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}