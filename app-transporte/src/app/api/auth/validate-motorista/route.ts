import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  cpf: z.string().min(11),
  codigoValidacao: z.string().min(6).max(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    
    console.log('🔍 Buscando motorista com:', {
      cpf: data.cpf,
      codigoValidacao: data.codigoValidacao
    })

    // Debug: Ver todos os motoristas para debug
    const todosMotoristas = await prisma.motorista.findMany({
      select: { id: true, cpf: true, codigoValidacao: true, validado: true, nome: true }
    })
    console.log('🔍 Todos os motoristas no banco:', todosMotoristas)

    // Buscar motorista pelo CPF e código de validação (sem verificar autenticação ainda)
    const motorista = await prisma.motorista.findFirst({
      where: {
        cpf: data.cpf,
        codigoValidacao: data.codigoValidacao,
        validado: false, // Só pode validar uma vez
      },
      include: {
        transportadora: true,
      }
    })

    console.log('🔍 Motorista encontrado:', motorista ? 'SIM' : 'NÃO')
    if (!motorista) {
      // Vamos ver se existe um motorista com este CPF
      const motoristaSemCodigo = await prisma.motorista.findFirst({
        where: { cpf: data.cpf },
        select: { id: true, cpf: true, codigoValidacao: true, validado: true }
      })
      console.log('🔍 Motorista com este CPF existe:', motoristaSemCodigo)
    }

    if (!motorista) {
      return NextResponse.json(
        { error: 'CPF ou código de validação inválido, ou motorista já validado' }, 
        { status: 400 }
      )
    }


    // Atualizar motorista como validado
    await prisma.motorista.update({
      where: { id: motorista.id },
      data: { validado: true }
    })

    return NextResponse.json({ 
      success: true, 
      motoristaId: motorista.id, 
      transportadoraId: motorista.transportadoraId,
    })
  } catch (e) {
    console.error('POST /api/auth/validate-motorista error:', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: e.issues }, 
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}