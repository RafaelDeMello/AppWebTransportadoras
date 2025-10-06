import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { StatusViagem } from '@/generated/prisma';

// Schema de validação para viagem
const viagemSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  dataInicio: z.string().datetime('Data de início inválida'),
  dataFim: z.string().datetime('Data de fim inválida').optional(),
  status: z.nativeEnum(StatusViagem).optional(),
  transportadoraId: z.string().uuid('ID da transportadora inválido'),
  motoristaId: z.string().uuid('ID do motorista inválido'),
});

// GET - Listar todas as viagens
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transportadoraId = searchParams.get('transportadoraId');
    const motoristaId = searchParams.get('motoristaId');
    const status = searchParams.get('status') as StatusViagem | null;

    const whereClause: {
      transportadoraId?: string;
      motoristaId?: string;
      status?: StatusViagem;
    } = {};
    if (transportadoraId) whereClause.transportadoraId = transportadoraId;
    if (motoristaId) whereClause.motoristaId = motoristaId;
    if (status) whereClause.status = status;

    const viagens = await prisma.viagem.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
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
        },
        receitas: true,
        despesas: true,
        acerto: true,
      }
    });

    // Calcular totais para cada viagem
    const viagensComTotais = viagens.map(viagem => {
      const totalReceitas = viagem.receitas.reduce((sum, receita) => sum + Number(receita.valor), 0);
      const totalDespesas = viagem.despesas.reduce((sum, despesa) => sum + Number(despesa.valor), 0);
      const lucro = totalReceitas - totalDespesas;

      return {
        ...viagem,
        totalReceitas,
        totalDespesas,
        lucro,
      };
    });

    return NextResponse.json(viagensComTotais);
  } catch (error) {
    console.error('Erro ao buscar viagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova viagem
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = viagemSchema.parse(body);

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

    // Verificar se motorista existe e pertence à transportadora
    const motorista = await prisma.motorista.findFirst({
      where: {
        id: validatedData.motoristaId,
        transportadoraId: validatedData.transportadoraId
      }
    });

    if (!motorista) {
      return NextResponse.json(
        { error: 'Motorista não encontrado ou não pertence à transportadora' },
        { status: 400 }
      );
    }

    // Validar datas
    const dataInicio = new Date(validatedData.dataInicio);
    const dataFim = validatedData.dataFim ? new Date(validatedData.dataFim) : null;

    if (dataFim && dataFim <= dataInicio) {
      return NextResponse.json(
        { error: 'Data de fim deve ser posterior à data de início' },
        { status: 400 }
      );
    }

    // Criar viagem
    const viagem = await prisma.viagem.create({
      data: {
        ...validatedData,
        dataInicio,
        dataFim,
      },
      include: {
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
        },
        receitas: true,
        despesas: true,
        acerto: true,
      }
    });

    return NextResponse.json(viagem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar viagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}