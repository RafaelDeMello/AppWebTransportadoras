import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para motorista
const motoristaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  cnh: z.string().optional(),
  telefone: z.string().optional(),
  transportadoraId: z.string().min(1, "Transportadora é obrigatória"),
});

// GET - Listar todos os motoristas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transportadoraId = searchParams.get('transportadoraId');

    const whereClause = transportadoraId ? { transportadoraId } : {};

    const motoristas = await prisma.motorista.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        transportadora: {
          select: {
            id: true,
            nome: true,
          }
        },
        _count: {
          select: {
            viagens: true,
          }
        }
      }
    });

    return NextResponse.json(motoristas);
  } catch (error) {
    console.error('Erro ao buscar motoristas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo motorista
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = motoristaSchema.parse(body);

    // Verificar se transportadora existe
    const transportadora = await prisma.transportadora.findUnique({
      where: { id: validatedData.transportadoraId }
    });

    if (!transportadora) {
      return NextResponse.json(
        { error: 'Transportadora não encontrada' },
        { status: 400 }
      );
    }

    // Verificar se CPF já existe
    if (validatedData.cpf) {
      const existingMotorista = await prisma.motorista.findUnique({
        where: { cpf: validatedData.cpf }
      });

      if (existingMotorista) {
        return NextResponse.json(
          { error: 'CPF já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Criar motorista
    const motorista = await prisma.motorista.create({
      data: {
        nome: validatedData.nome,
        cpf: validatedData.cpf,
        cnh: validatedData.cnh || null,
        telefone: validatedData.telefone || null,
        transportadoraId: validatedData.transportadoraId,
      },
      include: {
        transportadora: {
          select: {
            id: true,
            nome: true,
          }
        }
      }
    });

    return NextResponse.json(motorista, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar motorista:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}