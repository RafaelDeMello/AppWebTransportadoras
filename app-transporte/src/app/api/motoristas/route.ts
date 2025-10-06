import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const motoristas = await prisma.motorista.findMany({
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

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Validação básica
    if (!data.nome || !data.cpf || !data.cnh || !data.telefone || !data.transportadoraId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nome, CPF, CNH, telefone e transportadoraId são obrigatórios' 
        },
        { status: 400 }
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

    // Criar motorista
    const motorista = await prisma.motorista.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        cnh: data.cnh,
        telefone: data.telefone,
        transportadoraId: data.transportadoraId
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