import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Função para gerar código de validação único
function gerarCodigoValidacao(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let codigo = ''
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return codigo
}

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
  // Recuperar usuário autenticado
  const { supabase } = createClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    // Buscar dados completos do usuário
    const usuario = await prisma.usuario.findUnique({
      where: { supabaseUid: user.id },
    });
    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Segurança: Admin só pode acessar motoristas da sua transportadora
    const whereClause: { transportadoraId?: string } = {};
    if (usuario.role === 'ADMIN_TRANSPORTADORA') {
      whereClause.transportadoraId = usuario.transportadoraId ?? undefined;
    } else if (usuario.role === 'MOTORISTA') {
      // Motorista só pode acessar seu próprio cadastro
      return NextResponse.json([], { status: 200 });
    }

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

    // Gerar código único de validação
    let codigoValidacao;
    let codigoExiste = true;
    
    while (codigoExiste) {
      codigoValidacao = gerarCodigoValidacao();
      const existingCodigo = await prisma.motorista.findUnique({
        where: { codigoValidacao }
      });
      codigoExiste = !!existingCodigo;
    }

    // Criar motorista
    const motorista = await prisma.motorista.create({
      data: {
        nome: validatedData.nome,
        cpf: validatedData.cpf,
        cnh: validatedData.cnh || null,
        telefone: validatedData.telefone || null,
        transportadoraId: validatedData.transportadoraId,
        codigoValidacao: codigoValidacao,
        validado: false,
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