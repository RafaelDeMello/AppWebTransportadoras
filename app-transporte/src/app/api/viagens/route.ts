// ...existing code...
// ...existing code...
// ...existing code...
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { StatusViagem } from '@/generated/prisma';
import jwt from 'jsonwebtoken';

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
    // Pegar cookie de autenticação
    const authCookie = request.cookies.get('auth-token');
    if (!authCookie) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    // Verificar e decodificar JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    let decoded;
    try {
      decoded = jwt.verify(authCookie.value, JWT_SECRET) as { userId: string; type: string };
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    if (!decoded || !decoded.userId || !decoded.type) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
  // const transportadoraIdParam = searchParams.get('transportadoraId'); // Removido pois não é usado diretamente
    const motoristaIdParam = searchParams.get('motoristaId');
    const status = searchParams.get('status') as StatusViagem | null;

    const whereClause: {
      transportadoraId?: string;
      motoristaId?: string;
      status?: StatusViagem;
    } = {};

    if (decoded.type === 'MOTORISTA') {
      // Motorista só pode ver suas próprias viagens
      const usuario = await prisma.usuarios.findUnique({
        where: { id: decoded.userId },
        include: { motoristas: true }
      });
      if (!usuario || !usuario.motoristas) {
        return NextResponse.json({ error: 'Motorista não encontrado' }, { status: 404 });
      }
      whereClause.motoristaId = usuario.motoristas.id;
      // LOG: Diagnóstico de filtro
      console.log('[VIAGENS] [MOTORISTA] decoded.type:', decoded.type)
      console.log('[VIAGENS] [MOTORISTA] decoded.userId:', decoded.userId)
      console.log('[VIAGENS] [MOTORISTA] usuario.motoristas.id:', usuario.motoristas.id)
      console.log('[VIAGENS] [MOTORISTA] whereClause:', whereClause)
    } else if (decoded.type === 'TRANSPORTADORA') {
      // Transportadora só pode ver viagens dos motoristas vinculados a ela
      const usuario = await prisma.usuarios.findUnique({
        where: { id: decoded.userId },
        include: { transportadoras: true }
      });
      if (!usuario || !usuario.transportadoras) {
        return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 404 });
      }
      whereClause.transportadoraId = usuario.transportadoras.id;
      // Se vier motoristaId no param, garantir que pertence à transportadora
      if (motoristaIdParam) {
        const motorista = await prisma.motorista.findFirst({
          where: {
            id: motoristaIdParam,
            transportadoraId: usuario.transportadoras.id
          }
        });
        if (!motorista) {
          return NextResponse.json({ error: 'Motorista não pertence à transportadora' }, { status: 403 });
        }
        whereClause.motoristaId = motoristaIdParam;
      }
      // LOG: Diagnóstico de filtro
      console.log('[VIAGENS] [TRANSPORTADORA] decoded.type:', decoded.type)
      console.log('[VIAGENS] [TRANSPORTADORA] decoded.userId:', decoded.userId)
      console.log('[VIAGENS] [TRANSPORTADORA] usuario.transportadoras.id:', usuario.transportadoras.id)
      console.log('[VIAGENS] [TRANSPORTADORA] whereClause:', whereClause)
    }
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

    // LOG: Viagens retornadas
    viagens.forEach(v => {
      console.log('[VIAGENS] Viagem:', {
        id: v.id,
        motoristaId: v.motoristaId,
        transportadoraId: v.transportadoraId,
        descricao: v.descricao
      })
    })
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
    
    // Pegar cookie de autenticação
    const authCookie = request.cookies.get('auth-token');
    if (!authCookie) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    // Verificar e decodificar JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    let decoded;
    try {
      decoded = jwt.verify(authCookie.value, JWT_SECRET) as { userId: string; type: string };
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    if (!decoded || !decoded.userId || decoded.type !== 'MOTORISTA') {
      return NextResponse.json({ error: 'Apenas motoristas podem cadastrar viagens' }, { status: 403 });
    }
    // Buscar motorista logado
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.userId },
      include: { motoristas: true }
    });
    if (!usuario || !usuario.motoristas) {
      return NextResponse.json({ error: 'Motorista não encontrado' }, { status: 404 });
    }
    const motoristaId = usuario.motoristas.id;
    const transportadoraId = usuario.motoristas.transportadoraId;
    // Validar dados de entrada, ignorando motoristaId/transportadoraId do body
    const viagemData = {
      ...body,
      motoristaId,
      transportadoraId
    };
    const validatedData = viagemSchema.parse(viagemData);
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