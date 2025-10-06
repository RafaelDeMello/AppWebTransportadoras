import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para acerto
const acertoSchema = z.object({
  viagemId: z.string().uuid('ID da viagem inválido'),
  valor: z.number('Valor é obrigatório'),
  pago: z.boolean().optional(),
});

// GET - Listar todos os acertos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viagemId = searchParams.get('viagemId');
    const pago = searchParams.get('pago');

    const whereClause: {
      viagemId?: string;
      pago?: boolean;
    } = {};
    
    if (viagemId) whereClause.viagemId = viagemId;
    if (pago !== null) whereClause.pago = pago === 'true';

    const acertos = await prisma.acerto.findMany({
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

    return NextResponse.json(acertos);
  } catch (error) {
    console.error('Erro ao buscar acertos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo acerto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = acertoSchema.parse(body);

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

    // Verificar se já existe acerto para esta viagem
    const existingAcerto = await prisma.acerto.findUnique({
      where: { viagemId: validatedData.viagemId }
    });

    if (existingAcerto) {
      return NextResponse.json(
        { error: 'Já existe acerto para esta viagem' },
        { status: 400 }
      );
    }

    // Criar acerto
    const acerto = await prisma.acerto.create({
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

    return NextResponse.json(acerto, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar acerto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}