import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/authHelpers"
import { type AuthUser } from "@/lib/auth"

async function getAcertos(user: AuthUser) {
  try {
    // Construir filtros baseados no usuário
    const whereClause = user.role === 'ADMIN_TRANSPORTADORA' 
      ? { 
          viagem: { 
            transportadoraId: user.transportadoraId! 
          } 
        } // Admin vê acertos de todas viagens da transportadora
      : { 
          viagem: { 
            motoristaId: user.motoristaId! 
          } 
        } // Motorista só vê acertos das suas viagens

    const acertos = await prisma.acerto.findMany({
      where: whereClause,
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true,
            receitas: true,
            despesas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: acertos,
      total: acertos.length
    })
  } catch (error) {
    console.error('Erro ao buscar acertos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

async function createAcerto(user: AuthUser, req: NextRequest) {
  try {
    const data = await req.json()
    
    // Validação básica
    if (!data.viagemId || !data.valor) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ViagemId e valor são obrigatórios' 
        },
        { status: 400 }
      )
    }

    // Validar valor
    const valor = parseFloat(data.valor)
    if (isNaN(valor)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Valor deve ser um número válido' 
        },
        { status: 400 }
      )
    }

    // Verificar se viagem existe e se o usuário tem acesso
    const viagem = await prisma.viagem.findUnique({
      where: { id: data.viagemId },
      include: {
        transportadora: true,
        motorista: true,
        receitas: true,
        despesas: true
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

    // Verificar acesso baseado no role
    const hasAccess = user.role === 'ADMIN_TRANSPORTADORA' 
      ? viagem.transportadoraId === user.transportadoraId
      : viagem.motoristaId === user.motoristaId

    if (!hasAccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para criar acertos para esta viagem' 
        },
        { status: 403 }
      )
    }

    // Criar acerto
    const acerto = await prisma.acerto.create({
      data: {
        viagemId: data.viagemId,
        valor: valor,
        pago: data.pago || false
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

    return NextResponse.json(
      {
        success: true,
        data: acerto,
        message: 'Acerto criado com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar acerto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// Usuários autenticados podem listar (com filtros por role)
export async function GET(request: NextRequest) {
  return withAuth(request, getAcertos)
}

// Usuários autenticados podem criar (com validação de acesso)
export async function POST(request: NextRequest) {
  return withAuth(request, createAcerto)
}