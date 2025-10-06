import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const receitas = await prisma.receita.findMany({
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
      data: receitas,
      total: receitas.length
    })
  } catch (error) {
    console.error('Erro ao buscar receitas:', error)
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

    // Verificar se viagem existe
    const viagem = await prisma.viagem.findUnique({
      where: { id: data.viagemId }
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

    // Criar receita
    const receita = await prisma.receita.create({
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
        data: receita,
        message: 'Receita criada com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar receita:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}