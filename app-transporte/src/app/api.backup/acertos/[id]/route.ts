import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/authHelpers"
import { type AuthUser } from "@/lib/auth"

type Params = Promise<{ id: string }>

async function getAcerto(user: AuthUser, params: Params) {
  try {
    const { id } = await params

    // Buscar acerto com dados relacionados
    const acerto = await prisma.acerto.findUnique({
      where: { id },
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

    // Verificar acesso baseado no role
    const hasAccess = user.role === 'ADMIN_TRANSPORTADORA' 
      ? acerto.viagem.transportadoraId === user.transportadoraId
      : acerto.viagem.motoristaId === user.motoristaId

    if (!hasAccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para acessar este acerto' 
        },
        { status: 403 }
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

async function updateAcerto(user: AuthUser, req: NextRequest, params: Params) {
  try {
    const { id } = await params
    const data = await req.json()

    // Buscar acerto existente
    const acertoExistente = await prisma.acerto.findUnique({
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

    if (!acertoExistente) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acerto não encontrado' 
        },
        { status: 404 }
      )
    }

    // Verificar acesso
    const hasAccess = user.role === 'ADMIN_TRANSPORTADORA' 
      ? acertoExistente.viagem.transportadoraId === user.transportadoraId
      : acertoExistente.viagem.motoristaId === user.motoristaId

    if (!hasAccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para editar este acerto' 
        },
        { status: 403 }
      )
    }

    // Preparar dados para atualização
    const updateData: {
      valor?: number
      pago?: boolean
      viagemId?: string
    } = {}

    if (data.valor !== undefined) {
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
      updateData.valor = valor
    }

    if (data.pago !== undefined) {
      updateData.pago = Boolean(data.pago)
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
            error: 'Você não tem permissão para associar este acerto à viagem selecionada' 
          },
          { status: 403 }
        )
      }

      updateData.viagemId = data.viagemId
    }

    // Atualizar acerto
    const acertoAtualizado = await prisma.acerto.update({
      where: { id },
      data: updateData,
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
      data: acertoAtualizado,
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

async function deleteAcerto(user: AuthUser, params: Params) {
  try {
    const { id } = await params

    // Buscar acerto existente
    const acertoExistente = await prisma.acerto.findUnique({
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

    if (!acertoExistente) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acerto não encontrado' 
        },
        { status: 404 }
      )
    }

    // Verificar acesso
    const hasAccess = user.role === 'ADMIN_TRANSPORTADORA' 
      ? acertoExistente.viagem.transportadoraId === user.transportadoraId
      : acertoExistente.viagem.motoristaId === user.motoristaId

    if (!hasAccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para excluir este acerto' 
        },
        { status: 403 }
      )
    }

    // Deletar acerto
    await prisma.acerto.delete({
      where: { id }
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

// Usuários autenticados podem ver acerto específico (com validação de acesso)
export async function GET(request: NextRequest, params: Params) {
  return withAuth(request, (user) => getAcerto(user, params))
}

// Usuários autenticados podem atualizar (com validação de acesso)
export async function PUT(request: NextRequest, params: Params) {
  return withAuth(request, (user) => updateAcerto(user, request, params))
}

// Usuários autenticados podem deletar (com validação de acesso)
export async function DELETE(request: NextRequest, params: Params) {
  return withAuth(request, (user) => deleteAcerto(user, params))
}