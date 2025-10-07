import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/authHelpers"
import { type AuthUser } from "@/lib/auth"

async function getDespesas(user: AuthUser) {
  try {
    // Construir filtros baseados no usuário
    const whereClause = user.role === 'ADMIN_TRANSPORTADORA' 
      ? { 
          viagem: { 
            transportadoraId: user.transportadoraId! 
          } 
        } // Admin vê despesas de todas viagens da transportadora
      : { 
          viagem: { 
            motoristaId: user.motoristaId! 
          } 
        } // Motorista só vê despesas das suas viagens

    const despesas = await prisma.despesa.findMany({
      where: whereClause,
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: despesas,
      total: despesas.length
    })
  } catch (error) {
    console.error('Erro ao buscar despesas:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

async function createDespesa(user: AuthUser, req: NextRequest) {
  try {
    const data = await req.json()
    
    // Validação básica
    if (!data.viagemId || !data.valor || !data.descricao) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ViagemId, valor e descrição são obrigatórios' 
        },
        { status: 400 }
      )
    }

    // Validar valor
    const valor = parseFloat(data.valor)
    if (isNaN(valor) || valor <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Valor deve ser um número positivo' 
        },
        { status: 400 }
      )
    }

    // Verificar se viagem existe e se o usuário tem acesso
    const viagem = await prisma.viagem.findUnique({
      where: { id: data.viagemId },
      include: {
        transportadora: true,
        motorista: true
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
          error: 'Você não tem permissão para adicionar despesas a esta viagem' 
        },
        { status: 403 }
      )
    }

    // Criar despesa
    const despesa = await prisma.despesa.create({
      data: {
        viagemId: data.viagemId,
        valor: valor,
        descricao: data.descricao
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

    return NextResponse.json(
      {
        success: true,
        data: despesa,
        message: 'Despesa criada com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar despesa:', error)
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
  return withAuth(request, getDespesas)
}

// Usuários autenticados podem criar (com validação de acesso)
export async function POST(request: NextRequest) {
  return withAuth(request, createDespesa)
}