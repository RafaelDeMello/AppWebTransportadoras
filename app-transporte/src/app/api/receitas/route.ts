import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para receita
const receitaSchema = z.object({
  viagemId: z.string().uuid('ID da viagem inválido'),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
});

// GET - Listar todas as receitas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viagemId = searchParams.get('viagemId');
    const motoristaId = searchParams.get('motoristaId');

    const whereClause: {
      viagemId?: string;
      viagem?: {
        motoristaId: string;
      };
    } = {};

    if (viagemId) {
      whereClause.viagemId = viagemId;
    }

    if (motoristaId) {
      whereClause.viagem = {
        motoristaId: motoristaId
      };
    }

    const receitas = await prisma.receita.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        viagem: {
          select: {
            id: true,
            descricao: true,
            transportadora: {
              select: {
                id: true,
                nome: true,
              }
            },
            motorista: {
              select: {
                id: true,
                nome: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(receitas);
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova receita
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = receitaSchema.parse(body);

    // Verificar se viagem existe
    const viagem = await prisma.viagem.findUnique({
      where: { id: validatedData.viagemId }
    });

    if (!viagem) {
      return NextResponse.json(
        { error: 'Viagem não encontrada' },
        { status: 400 }
      );
    }

    // Criar receita
    const receita = await prisma.receita.create({
      data: validatedData,
      include: {
        viagem: {
          select: {
            id: true,
            descricao: true,
            transportadora: {
              select: {
                id: true,
                nome: true,
              }
            },
            motorista: {
              select: {
                id: true,
                nome: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(receita, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar receita:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}