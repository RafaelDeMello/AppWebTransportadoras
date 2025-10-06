import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const transportadoras = await prisma.transportadora.findMany({
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
    return NextResponse.json(transportadoras)
  } catch (error) {
    console.error('Erro ao buscar transportadoras:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Validação básica
    if (!data.nome || !data.cnpj) {
      return NextResponse.json(
        { error: 'Nome e CNPJ são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se CNPJ já existe
    const existingTransportadora = await prisma.transportadora.findUnique({
      where: { cnpj: data.cnpj }
    })

    if (existingTransportadora) {
      return NextResponse.json(
        { error: 'CNPJ já está cadastrado' },
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
    
    return NextResponse.json(transportadora, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar transportadora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}