import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, withAdminAuth } from "@/lib/authHelpers"
import { type AuthUser } from "@/lib/auth"

async function getMotoristas(user: AuthUser) {
  try {
    // Construir filtros baseados no usuário
    const whereClause = user.role === 'ADMIN_TRANSPORTADORA' 
      ? { transportadoraId: user.transportadoraId! } // Admin vê todos motoristas da sua transportadora
      : { id: user.motoristaId! } // Motorista só vê seus próprios dados

    const motoristas = await prisma.motorista.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: motoristas,
      total: motoristas.length
    })
  } catch (error) {
    console.error('Erro ao buscar motoristas:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

async function createMotorista(user: AuthUser, req: NextRequest) {
  try {
    const data = await req.json()
    
    // Validação básica
    if (!data.nome || !data.cpf || !data.cnh || !data.telefone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nome, CPF, CNH e telefone são obrigatórios' 
        },
        { status: 400 }
      )
    }

    // Para admins, usar a transportadora atual. Para motoristas, não permitir criação
    const transportadoraId = data.transportadoraId || user.transportadoraId!

    // Verificar se o admin está tentando criar motorista para sua própria transportadora
    if (transportadoraId !== user.transportadoraId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você só pode criar motoristas para sua própria transportadora' 
        },
        { status: 403 }
      )
    }

    // Verificar se CPF já existe
    const existingMotorista = await prisma.motorista.findUnique({
      where: { cpf: data.cpf }
    })

    if (existingMotorista) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CPF já está cadastrado' 
        },
        { status: 409 }
      )
    }

    // Criar motorista
    const motorista = await prisma.motorista.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        cnh: data.cnh,
        telefone: data.telefone,
        transportadoraId: transportadoraId
      },
      include: {
        transportadora: true
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: motorista,
        message: 'Motorista criado com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar motorista:', error)
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
  return withAuth(request, getMotoristas)
}

// Apenas admins podem criar motoristas
export async function POST(request: NextRequest) {
  return withAdminAuth(request, createMotorista)
}