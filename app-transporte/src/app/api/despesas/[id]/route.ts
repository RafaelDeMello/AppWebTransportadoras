import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/authHelpers"
import { type AuthUser } from "@/lib/auth"

type Params = {
  params: { id: string }
}

async function getDespesa(user: AuthUser, params: Params) {
  try {
    const { id } = params.params

    // Buscar despesa com dados relacionados
    const despesa = await prisma.despesa.findUnique({
      where: { id },
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true
          }
        }
      }
    })

    if (!despesa) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Despesa não encontrada' 
        },
        { status: 404 }
      )
    }

    // Verificar acesso baseado no role
    const hasAccess = user.role === 'ADMIN_TRANSPORTADORA' 
      ? despesa.viagem.transportadoraId === user.transportadoraId
      : despesa.viagem.motoristaId === user.motoristaId

    if (!hasAccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para acessar esta despesa' 
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: despesa
    })
  } catch (error) {
    console.error('Erro ao buscar despesa:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

async function updateDespesa(user: AuthUser, req: NextRequest, params: Params) {
  try {
    const { id } = params.params
    const data = await req.json()

    // Buscar despesa existente
    const despesaExistente = await prisma.despesa.findUnique({
      where: { id },
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true
          }
        }
      }
    })

    if (!despesaExistente) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Despesa não encontrada' 
        },
        { status: 404 }
      )
    }

    // Verificar acesso
    const hasAccess = user.role === 'ADMIN_TRANSPORTADORA' 
      ? despesaExistente.viagem.transportadoraId === user.transportadoraId
      : despesaExistente.viagem.motoristaId === user.motoristaId

    if (!hasAccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para editar esta despesa' 
        },
        { status: 403 }
      )
    }

    // Preparar dados para atualização
    const updateData: {
      valor?: number
      descricao?: string
      viagemId?: string
    } = {}

    if (data.valor !== undefined) {
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
      updateData.valor = valor
    }

    if (data.descricao !== undefined) {
      if (!data.descricao.trim()) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Descrição é obrigatória' 
          },
          { status: 400 }
        )
      }
      updateData.descricao = data.descricao.trim()
    }

    if (data.viagemId !== undefined) {
      // Verificar se nova viagem existe e se o usuário tem acesso
      const novaViagem = await prisma.viagem.findUnique({
        where: { id: data.viagemId },
        include: {
          transportadora: true,
          motorista: true
        }
      })

      if (!novaViagem) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Viagem não encontrada' 
          },
          { status: 404 }
        )
      }

      const hasAccessToNewViagem = user.role === 'ADMIN_TRANSPORTADORA' 
        ? novaViagem.transportadoraId === user.transportadoraId
        : novaViagem.motoristaId === user.motoristaId

      if (!hasAccessToNewViagem) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Você não tem permissão para associar esta despesa à viagem selecionada' 
          },
          { status: 403 }
        )
      }

      updateData.viagemId = data.viagemId
    }

    // Atualizar despesa
    const despesaAtualizada = await prisma.despesa.update({
      where: { id },
      data: updateData,
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: despesaAtualizada,
      message: 'Despesa atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

async function deleteDespesa(user: AuthUser, params: Params) {
  try {
    const { id } = params.params

    // Buscar despesa existente
    const despesaExistente = await prisma.despesa.findUnique({
      where: { id },
      include: {
        viagem: {
          include: {
            transportadora: true,
            motorista: true
          }
        }
      }
    })

    if (!despesaExistente) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Despesa não encontrada' 
        },
        { status: 404 }
      )
    }

    // Verificar acesso
    const hasAccess = user.role === 'ADMIN_TRANSPORTADORA' 
      ? despesaExistente.viagem.transportadoraId === user.transportadoraId
      : despesaExistente.viagem.motoristaId === user.motoristaId

    if (!hasAccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para excluir esta despesa' 
        },
        { status: 403 }
      )
    }

    // Deletar despesa
    await prisma.despesa.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Despesa excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir despesa:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// Usuários autenticados podem ver despesa específica (com validação de acesso)
export async function GET(request: NextRequest, params: Params) {
  return withAuth(request, (user) => getDespesa(user, params))
}

// Usuários autenticados podem atualizar (com validação de acesso)
export async function PUT(request: NextRequest, params: Params) {
  return withAuth(request, (user) => updateDespesa(user, request, params))
}

// Usuários autenticados podem deletar (com validação de acesso)
export async function DELETE(request: NextRequest, params: Params) {
  return withAuth(request, (user) => deleteDespesa(user, params))
}