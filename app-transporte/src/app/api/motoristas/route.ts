import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// import bcrypt removido, pois não está mais sendo utilizado

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
  email: z.string().email("Email é obrigatório"),
  senha: z.string().min(6, "Senha é obrigatória"),
});

// GET - Listar todos os motoristas
export async function GET(request: NextRequest) {
  try {
    // Buscar transportadoraId do usuário logado (exemplo: via header ou cookie)
    // Aqui, para simplificar, vamos supor que o transportadoraId vem via header
    const transportadoraId = request.headers.get('x-transportadora-id');
    if (!transportadoraId) {
      return NextResponse.json({ error: 'Transportadora não identificada' }, { status: 401 });
    }
    const motoristas = await prisma.motorista.findMany({
      where: { transportadoraId },
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

        // Verificar se já existe motorista com mesmo CPF ou email
        const motoristaExistente = await prisma.motorista.findFirst({
          where: {
            OR: [
              { cpf: validatedData.cpf },
              { email: validatedData.email }
            ]
          }
        });
        if (motoristaExistente) {
          return NextResponse.json({ error: 'Já existe um motorista com este CPF ou email' }, { status: 400 });
        }

        // Gerar hash da senha
  // senhaHash removido, pois não é utilizado no modelo Motorista

        // Criar motorista
        // Criar motorista
        const motorista = await prisma.motorista.create({
          data: {
            nome: validatedData.nome,
            cpf: validatedData.cpf,
            cnh: validatedData.cnh || null,
            telefone: validatedData.telefone || null,
            transportadoraId: validatedData.transportadoraId,
            email: validatedData.email,
            codigoValidacao: codigoValidacao || '',
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

        // Gerar hash da senha para usuario
        const senhaHash = await import('bcryptjs').then(bcrypt => bcrypt.hash(validatedData.senha, 10));

        // Criar usuário vinculado ao motorista
        await prisma.usuarios.create({
          data: {
            id: motorista.id, // mesmo id do motorista
            email: validatedData.email,
            senhaHash,
            role: 'MOTORISTA',
            motoristaId: motorista.id,
            transportadoraId: validatedData.transportadoraId,
            supabaseUid: '', // pode ser preenchido depois se necessário
            createdAt: new Date(),
            updatedAt: new Date(),
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