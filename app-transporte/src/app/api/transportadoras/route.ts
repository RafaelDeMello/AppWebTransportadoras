import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para transportadora
const transportadoraSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 caracteres'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

// GET - Listar todas as transportadoras
export async function GET() {
  try {
    const transportadoras = await prisma.transportadora.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            motoristas: true,
            viagens: true,
          }
        }
      }
    });

    return NextResponse.json(transportadoras);
  } catch (error) {
    console.error('Erro ao buscar transportadoras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova transportadora
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = transportadoraSchema.parse(body);

    // Verificar se CNPJ já existe
    const existingTransportadora = await prisma.transportadora.findUnique({
      where: { cnpj: validatedData.cnpj }
    });

    if (existingTransportadora) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 400 }
      );
    }

    // Criar transportadora
    const transportadora = await prisma.transportadora.create({
      data: validatedData
    });

    return NextResponse.json(transportadora, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar transportadora:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}