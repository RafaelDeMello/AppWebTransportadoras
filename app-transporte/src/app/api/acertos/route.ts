import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const acertos = await prisma.acerto.findMany({
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

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Validação básica
    if (!data.viagemId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ViagemId é obrigatório' 
        },
        { status: 400 }
      )
    }

    // Verificar se viagem existe
    const viagem = await prisma.viagem.findUnique({
      where: { id: data.viagemId },
      include: {
        receitas: true,
        despesas: true,
        acerto: true
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

    // Verificar se já existe acerto para essa viagem
    if (viagem.acerto) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Já existe um acerto para esta viagem' 
        },
        { status: 409 }
      )
    }

    // Calcular o valor do acerto automaticamente
    const totalReceitas = viagem.receitas.reduce((sum, receita) => {
      return sum + Number(receita.valor)
    }, 0)

    const totalDespesas = viagem.despesas.reduce((sum, despesa) => {
      return sum + Number(despesa.valor)
    }, 0)

    const valorAcerto = totalReceitas - totalDespesas

    // Criar acerto
    const acerto = await prisma.acerto.create({
      data: {
        viagemId: data.viagemId,
        valor: valorAcerto,
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
        message: 'Acerto criado com sucesso',
        calculado: {
          totalReceitas,
          totalDespesas,
          valorAcerto
        }
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