import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para despesa
const despesaSchema = z.object({
  viagemId: z.string().uuid('ID da viagem inválido'),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
});

// GET - Listar todas as despesas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viagemId = searchParams.get('viagemId');

    const whereClause = viagemId ? { viagemId } : {};

    const despesas = await prisma.despesa.findMany({
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

    return NextResponse.json(despesas);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova despesa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = despesaSchema.parse(body);

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

    // Criar despesa
    const despesa = await prisma.despesa.create({
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

    return NextResponse.json(despesa, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar despesa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}