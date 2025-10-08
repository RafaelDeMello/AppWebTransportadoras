'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '../../../../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Car, DollarSign, Receipt, Calculator } from 'lucide-react'

interface Motorista {
  id: string
  nome: string
  cpf: string
  cnh: string
  telefone?: string
  endereco?: string
  dataNascimento?: string
  status: 'ATIVO' | 'INATIVO'
  validado: boolean
  codigoValidacao?: string
  transportadora?: {
    id: string
    nome: string
  }
}

interface Viagem {
  id: string
  descricao: string
  dataInicio: string
  dataFim?: string
  status: string
}

interface Despesa {
  id: string
  descricao: string
  valor: number
  createdAt: string
  viagem: {
    id: string
    descricao: string
  }
}

interface Receita {
  id: string
  descricao: string
  valor: number
  createdAt: string
  viagem: {
    id: string
    descricao: string
  }
}

interface Acerto {
  id: string
  valor: number
  pago: boolean
  createdAt: string
  viagem: {
    id: string
    descricao: string
  }
}

export default function DashboardMotorista() {
  const params = useParams()
  const router = useRouter()
  const motoristaId = params.id as string

  const [motorista, setMotorista] = useState<Motorista | null>(null)
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [acertos, setAcertos] = useState<Acerto[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'viagens' | 'despesas' | 'receitas' | 'acertos'>('viagens')

  useEffect(() => {
    async function carregarDadosMotorista() {
      try {
        setLoading(true)
        
        // Carregar dados do motorista
        const resMotorista = await fetch(`/api/motoristas/${motoristaId}`)
        if (resMotorista.ok) {
          const dadosMotorista = await resMotorista.json()
          setMotorista(dadosMotorista)
        }

        // Carregar viagens do motorista
        const resViagens = await fetch(`/api/viagens?motoristaId=${motoristaId}`)
        if (resViagens.ok) {
          const dadosViagens = await resViagens.json()
          setViagens(dadosViagens)
        }

        // Carregar despesas do motorista
        const resDespesas = await fetch(`/api/despesas?motoristaId=${motoristaId}`)
        if (resDespesas.ok) {
          const dadosDespesas = await resDespesas.json()
          setDespesas(dadosDespesas)
        }

        // Carregar receitas do motorista
        const resReceitas = await fetch(`/api/receitas?motoristaId=${motoristaId}`)
        if (resReceitas.ok) {
          const dadosReceitas = await resReceitas.json()
          setReceitas(dadosReceitas)
        }

        // Carregar acertos do motorista
        const resAcertos = await fetch(`/api/acertos?motoristaId=${motoristaId}`)
        if (resAcertos.ok) {
          const dadosAcertos = await resAcertos.json()
          setAcertos(dadosAcertos)
        }

      } catch (err) {
        console.error('Erro ao carregar dados do motorista:', err)
        alert('Erro ao carregar dados do motorista')
      } finally {
        setLoading(false)
      }
    }

    if (motoristaId) {
      carregarDadosMotorista()
    }
  }, [motoristaId])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg">Carregando dados do motorista...</p>
        </div>
      </Layout>
    )
  }

  if (!motorista) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Motorista não encontrado</h1>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </Layout>
    )
  }

  const totalViagens = viagens.length
  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0)
  const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0)
  const saldoAcertos = acertos.reduce((sum, a) => sum + (a.pago ? a.valor : -a.valor), 0)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Dashboard - {motorista.nome}</h1>
            <p className="text-gray-600">CPF: {motorista.cpf} | CNH: {motorista.cnh}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                motorista.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {motorista.status}
              </span>
              {motorista.codigoValidacao && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  motorista.validado ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {motorista.validado ? '✅ Validado' : '⏳ Aguardando Validação'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Viagens</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViagens}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Acertos</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldoAcertos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {saldoAcertos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Navegação */}
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('viagens')}
            className={`pb-2 px-1 ${
              activeTab === 'viagens' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Viagens ({totalViagens})
          </button>
          <button
            onClick={() => setActiveTab('despesas')}
            className={`pb-2 px-1 ${
              activeTab === 'despesas' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Despesas ({despesas.length})
          </button>
          <button
            onClick={() => setActiveTab('receitas')}
            className={`pb-2 px-1 ${
              activeTab === 'receitas' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Receitas ({receitas.length})
          </button>
          <button
            onClick={() => setActiveTab('acertos')}
            className={`pb-2 px-1 ${
              activeTab === 'acertos' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Acertos ({acertos.length})
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'viagens' && 'Viagens'}
              {activeTab === 'despesas' && 'Despesas'}
              {activeTab === 'receitas' && 'Receitas'}
              {activeTab === 'acertos' && 'Acertos'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'viagens' && (
              <div className="space-y-4">
                {viagens.length === 0 ? (
                  <p className="text-gray-500">Nenhuma viagem cadastrada ainda.</p>
                ) : (
                  viagens.map((viagem) => (
                    <div key={viagem.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{viagem.descricao}</h3>
                          <p className="text-sm text-gray-600">
                            Início: {new Date(viagem.dataInicio).toLocaleDateString('pt-BR')}
                          </p>
                          {viagem.dataFim && (
                            <p className="text-sm text-gray-600">
                              Fim: {new Date(viagem.dataFim).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {viagem.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'despesas' && (
              <div className="space-y-4">
                {despesas.length === 0 ? (
                  <p className="text-gray-500">Nenhuma despesa cadastrada ainda.</p>
                ) : (
                  despesas.map((despesa) => (
                    <div key={despesa.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{despesa.descricao}</h3>
                          <p className="text-sm text-gray-600">
                            Data: {new Date(despesa.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600">Viagem: {despesa.viagem.descricao}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'receitas' && (
              <div className="space-y-4">
                {receitas.length === 0 ? (
                  <p className="text-gray-500">Nenhuma receita cadastrada ainda.</p>
                ) : (
                  receitas.map((receita) => (
                    <div key={receita.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{receita.descricao}</h3>
                          <p className="text-sm text-gray-600">
                            Data: {new Date(receita.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600">Viagem: {receita.viagem.descricao}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            R$ {receita.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'acertos' && (
              <div className="space-y-4">
                {acertos.length === 0 ? (
                  <p className="text-gray-500">Nenhum acerto cadastrado ainda.</p>
                ) : (
                  acertos.map((acerto) => (
                    <div key={acerto.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{acerto.viagem.descricao}</h3>
                          <p className="text-sm text-gray-600">
                            Data: {new Date(acerto.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            acerto.pago ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {acerto.pago ? '+' : '-'} R$ {acerto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            acerto.pago ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {acerto.pago ? 'PAGO' : 'PENDENTE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}