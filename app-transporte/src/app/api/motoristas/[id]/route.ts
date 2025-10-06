import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para atualização de motorista
const motoristaUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  cpf: z.string().min(11, 'CPF deve ter 11 caracteres').optional(),
  cnh: z.string().min(1, 'CNH é obrigatória').optional(),
  telefone: z.string().min(1, 'Telefone é obrigatório').optional(),
  transportadoraId: z.string().uuid('ID da transportadora inválido').optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Pelo menos um campo deve ser fornecido para atualização"
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Buscar motorista por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const motorista = await prisma.motorista.findUnique({
      where: { id },
      include: {
        transportadora: {
          select: {
            id: true,
            nome: true,
          }
        },
        viagens: {
          include: {
            receitas: true,
            despesas: true,
            acerto: true,
          }
        },
        _count: {
          select: {
            viagens: true,
          }
        }
      }
    });

    if (!motorista) {
      return NextResponse.json(
        { error: 'Motorista não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(motorista);
  } catch (error) {
    console.error('Erro ao buscar motorista:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar motorista
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = motoristaUpdateSchema.parse(body);

    // Verificar se motorista existe
    const existingMotorista = await prisma.motorista.findUnique({
      where: { id }
    });

    if (!existingMotorista) {
      return NextResponse.json(
        { error: 'Motorista não encontrado' },
        { status: 404 }
      );
    }

    // Se transportadoraId está sendo atualizado, verificar se transportadora existe
    if (validatedData.transportadoraId) {
      const transportadora = await prisma.transportadora.findUnique({
        where: { id: validatedData.transportadoraId }
      });

      if (!transportadora) {
        return NextResponse.json(
          { error: 'Transportadora não encontrada' },
          { status: 400 }
        );
      }
    }

    // Se CPF está sendo atualizado, verificar se não existe outro com o mesmo CPF
    if (validatedData.cpf) {
      const cpfExists = await prisma.motorista.findFirst({
        where: {
          cpf: validatedData.cpf,
          NOT: { id }
        }
      });

      if (cpfExists) {
        return NextResponse.json(
          { error: 'CPF já cadastrado para outro motorista' },
          { status: 400 }
        );
      }
    }

    // Atualizar motorista
    const motorista = await prisma.motorista.update({
      where: { id },
      data: validatedData,
      include: {
        transportadora: {
          select: {
            id: true,
            nome: true,
          }
        }
      }
    });

    return NextResponse.json(motorista);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar motorista:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir motorista
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Verificar se motorista existe
    const existingMotorista = await prisma.motorista.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            viagens: true,
          }
        }
      }
    });

    if (!existingMotorista) {
      return NextResponse.json(
        { error: 'Motorista não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se há viagens vinculadas
    if (existingMotorista._count.viagens > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir motorista com viagens vinculadas' },
        { status: 400 }
      );
    }

    // Excluir motorista
    await prisma.motorista.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Motorista excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir motorista:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}