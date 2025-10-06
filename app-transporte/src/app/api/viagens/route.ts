import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, withAdminAuth } from "@/lib/authHelpers"
import { type AuthUser } from "@/lib/auth"

async function getViagens(user: AuthUser) {
  try {
    // Construir filtros baseados no usuário
    const whereClause = user.role === 'ADMIN_TRANSPORTADORA' 
      ? { transportadoraId: user.transportadoraId! } // Admin vê todas viagens da sua transportadora
      : { motoristaId: user.motoristaId! } // Motorista só vê suas próprias viagens

    const viagens = await prisma.viagem.findMany({
      where: whereClause,
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

async function createViagem(user: AuthUser, req: NextRequest) {
  try {
    const data = await req.json()
    
    // Validação básica
    if (!data.descricao || !data.dataInicio || !data.motoristaId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Descrição, data de início e motoristaId são obrigatórios' 
        },
        { status: 400 }
      )
    }

    // Usar a transportadora do usuário logado
    const transportadoraId = user.transportadoraId!

    // Verificar se motorista existe e pertence à mesma transportadora
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

    if (motorista.transportadoraId !== transportadoraId) {
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
        transportadoraId: transportadoraId,
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

// Qualquer usuário autenticado pode listar (com filtros por role)
export async function GET(request: NextRequest) {
  return withAuth(request, getViagens)
}

// Apenas admins podem criar viagens
export async function POST(request: NextRequest) {
  return withAdminAuth(request, createViagem)
}