import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para transportadora
const transportadoraSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Pelo menos um campo deve ser fornecido para atualização"
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Buscar transportadora por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const transportadora = await prisma.transportadora.findUnique({
      where: { id },
      include: {
        motoristas: true,
        viagens: {
          include: {
            motorista: true,
            receitas: true,
            despesas: true,
            acerto: true,
          }
        },
        _count: {
          select: {
            motoristas: true,
            viagens: true,
          }
        }
      }
    });

    if (!transportadora) {
      return NextResponse.json(
        { error: 'Transportadora não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(transportadora);
  } catch (error) {
    console.error('Erro ao buscar transportadora:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar transportadora
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = transportadoraSchema.parse(body);

    // Verificar se transportadora existe
    const existingTransportadora = await prisma.transportadora.findUnique({
      where: { id }
    });

    if (!existingTransportadora) {
      return NextResponse.json(
        { error: 'Transportadora não encontrada' },
        { status: 404 }
      );
    }

    // Se CNPJ está sendo atualizado, verificar se não existe outro com o mesmo CNPJ
    if (validatedData.cnpj) {
      const cnpjExists = await prisma.transportadora.findFirst({
        where: {
          cnpj: validatedData.cnpj,
          NOT: { id }
        }
      });

      if (cnpjExists) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado para outra transportadora' },
          { status: 400 }
        );
      }
    }

    // Atualizar transportadora
    const transportadora = await prisma.transportadora.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(transportadora);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar transportadora:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir transportadora
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Verificar se transportadora existe
    const existingTransportadora = await prisma.transportadora.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            motoristas: true,
            viagens: true,
          }
        }
      }
    });

    if (!existingTransportadora) {
      return NextResponse.json(
        { error: 'Transportadora não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se há motoristas ou viagens vinculados
    if (existingTransportadora._count.motoristas > 0 || existingTransportadora._count.viagens > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir transportadora com motoristas ou viagens vinculados' },
        { status: 400 }
      );
    }

    // Excluir transportadora
    await prisma.transportadora.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Transportadora excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir transportadora:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}