import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, withAdminAuth } from "@/lib/authHelpers"
import { type AuthUser } from "@/lib/auth"

async function getTransportadoras(user: AuthUser) {
  try {
    // Construir filtros baseados no usuário
    const whereClause = user.role === 'ADMIN_TRANSPORTADORA' 
      ? { id: user.transportadoraId! } // Admin só vê sua transportadora
      : { id: user.transportadoraId! } // Motorista também só vê sua transportadora

    const transportadoras = await prisma.transportadora.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: transportadoras,
      total: transportadoras.length
    })
  } catch (error) {
    console.error('Erro ao buscar transportadoras:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

async function createTransportadora(user: AuthUser, req: NextRequest) {
  try {
    const data = await req.json()
    
    // Validação básica
    if (!data.nome || !data.cnpj) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nome e CNPJ são obrigatórios' 
        },
        { status: 400 }
      )
    }

    // Verificar se CNPJ já existe
    const existingTransportadora = await prisma.transportadora.findUnique({
      where: { cnpj: data.cnpj }
    })

    if (existingTransportadora) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CNPJ já está cadastrado' 
        },
        { status: 409 }
      )
    }

    const transportadora = await prisma.transportadora.create({
      data: {
        nome: data.nome,
        cnpj: data.cnpj,
        email: data.email || null,
        telefone: data.telefone || null,
        endereco: data.endereco || null,
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: transportadora,
        message: 'Transportadora criada com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar transportadora:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// Endpoints públicos (protegidos por autenticação)
export async function GET(request: NextRequest) {
  return withAuth(request, getTransportadoras)
}

// Apenas admins podem criar transportadoras
export async function POST(request: NextRequest) {
  return withAdminAuth(request, createTransportadora)
}