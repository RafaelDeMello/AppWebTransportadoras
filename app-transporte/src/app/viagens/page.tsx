'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Truck, 
  MapPin, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Route as RouteIcon
} from 'lucide-react'

// Tipos
interface Viagem {
  id: string
  origem: string
  destino: string
  distancia: number
  dataInicio: string
  dataFim?: string
  valorFrete: number
  motoristaNome: string
  transportadoraNome: string
  status: 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  createdAt: string
}

// Mock data
const mockViagens: Viagem[] = [
  {
    id: '1',
    origem: 'São Paulo - SP',
    destino: 'Rio de Janeiro - RJ',
    distancia: 435,
    dataInicio: '2024-01-15',
    dataFim: '2024-01-16',
    valorFrete: 2500.00,
    motoristaNome: 'João Silva Santos',
    transportadoraNome: 'Transportes São Paulo Ltda',
    status: 'CONCLUIDA',
    createdAt: '2024-01-10'
  },
  {
    id: '2',
    origem: 'São Paulo - SP',
    destino: 'Belo Horizonte - MG',
    distancia: 586,
    dataInicio: '2024-01-18',
    valorFrete: 3200.00,
    motoristaNome: 'Maria Santos Costa',
    transportadoraNome: 'Transportes São Paulo Ltda',
    status: 'EM_ANDAMENTO',
    createdAt: '2024-01-15'
  },
  {
    id: '3',
    origem: 'Rio de Janeiro - RJ',
    destino: 'Porto Alegre - RS',
    distancia: 1553,
    dataInicio: '2024-01-25',
    valorFrete: 5800.00,
    motoristaNome: 'Pedro Oliveira Lima',
    transportadoraNome: 'Logística Rio Grande',
    status: 'PLANEJADA',
    createdAt: '2024-01-20'
  },
  {
    id: '4',
    origem: 'Belo Horizonte - MG',
    destino: 'Salvador - BA',
    distancia: 1372,
    dataInicio: '2024-01-10',
    valorFrete: 4500.00,
    motoristaNome: 'Ana Paula Ferreira',
    transportadoraNome: 'Express Minas Gerais',
    status: 'CANCELADA',
    createdAt: '2024-01-05'
  },
  {
    id: '5',
    origem: 'São Paulo - SP',
    destino: 'Curitiba - PR',
    distancia: 408,
    dataInicio: '2024-01-22',
    valorFrete: 2100.00,
    motoristaNome: 'João Silva Santos',
    transportadoraNome: 'Transportes São Paulo Ltda',
    status: 'EM_ANDAMENTO',
    createdAt: '2024-01-18'
  }
]

export default function ViagensPage() {
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'>('TODAS')

  // Carregar dados da API
  useEffect(() => {
    const loadViagens = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/viagens')
        if (response.ok) {
          const data = await response.json()
          // Mapear os dados da API para o formato esperado
          const mappedData = data.map((v: {
            id: string;
            descricao: string;
            dataInicio: string;
            dataFim?: string;
            status: string;
            motorista?: { id: string; nome: string };
            transportadora?: { id: string; nome: string };
            totalReceitas?: number;
            totalDespesas?: number;
            lucro?: number;
            createdAt: string;
          }) => ({
            id: v.id,
            origem: v.descricao.split(' - ')[0] || v.descricao,
            destino: v.descricao.split(' - ')[1] || 'Destino',
            dataInicio: new Date(v.dataInicio).toLocaleDateString('pt-BR'),
            dataFim: v.dataFim ? new Date(v.dataFim).toLocaleDateString('pt-BR') : null,
            status: v.status,
            motoristaNome: v.motorista?.nome || 'N/A',
            motoristaId: v.motorista?.id,
            transportadoraNome: v.transportadora?.nome || 'N/A',
            transportadoraId: v.transportadora?.id,
            valorReceita: v.totalReceitas || 0,
            valorDespesa: v.totalDespesas || 0,
            lucro: v.lucro || 0,
            createdAt: new Date(v.createdAt).toLocaleDateString('pt-BR')
          }))
          setViagens(mappedData)
        } else {
          console.error('Erro ao carregar viagens:', response.statusText)
          setViagens(mockViagens)
        }
      } catch (error) {
        console.error('Erro ao carregar viagens:', error)
        setViagens(mockViagens)
      } finally {
        setIsLoading(false)
      }
    }

    loadViagens()
  }, [])

  // Filtrar viagens
  const filteredViagens = viagens.filter(viagem => {
    const matchesSearch = 
      viagem.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viagem.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viagem.motoristaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viagem.transportadoraNome.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'TODAS' || viagem.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleEdit = (id: string) => {
    console.log('Editar viagem:', id)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta viagem?')) {
      setViagens(prev => prev.filter(v => v.id !== id))
    }
  }

  const handleAdd = () => {
    console.log('Adicionar nova viagem')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANEJADA':
        return 'text-blue-600 bg-blue-100'
      case 'EM_ANDAMENTO':
        return 'text-orange-600 bg-orange-100'
      case 'CONCLUIDA':
        return 'text-green-600 bg-green-100'
      case 'CANCELADA':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANEJADA':
        return <Calendar className="h-4 w-4" />
      case 'EM_ANDAMENTO':
        return <Clock className="h-4 w-4" />
      case 'CONCLUIDA':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELADA':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANEJADA':
        return 'Planejada'
      case 'EM_ANDAMENTO':
        return 'Em Andamento'
      case 'CONCLUIDA':
        return 'Concluída'
      case 'CANCELADA':
        return 'Cancelada'
      default:
        return status
    }
  }

  const getTotalStats = () => {
    return {
      total: viagens.length,
      planejadas: viagens.filter(v => v.status === 'PLANEJADA').length,
      emAndamento: viagens.filter(v => v.status === 'EM_ANDAMENTO').length,
      concluidas: viagens.filter(v => v.status === 'CONCLUIDA').length,
      valorTotal: viagens
        .filter(v => v.status === 'CONCLUIDA')
        .reduce((acc, v) => acc + v.valorFrete, 0)
    }
  }

  const stats = getTotalStats()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-8 w-8 text-blue-600" />
              Viagens
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie as viagens da transportadora
            </p>
          </div>
          <Button onClick={handleAdd} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Viagem
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por origem, destino, motorista ou transportadora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['TODAS', 'PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {getStatusText(status === 'TODAS' ? 'TODAS' : status).replace('Concluída', 'Concluídas')}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planejadas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.planejadas}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.emAndamento}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.concluidas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Faturamento</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.valorTotal)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Lista de Viagens */}
        {!isLoading && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredViagens.map((viagem) => (
              <Card key={viagem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <RouteIcon className="h-5 w-5 text-blue-600" />
                        {viagem.origem} → {viagem.destino}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(viagem.status)}`}>
                          {getStatusIcon(viagem.status)}
                          {getStatusText(viagem.status)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(viagem.id)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(viagem.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{viagem.distancia} km</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold text-green-600">
                        {formatCurrency(viagem.valorFrete)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Início: {formatDate(viagem.dataInicio)}
                      {viagem.dataFim && ` | Fim: ${formatDate(viagem.dataFim)}`}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>Motorista:</strong> {viagem.motoristaNome}</p>
                    <p><strong>Transportadora:</strong> {viagem.transportadoraNome}</p>
                  </div>

                  {viagem.status === 'PLANEJADA' && (
                    <div className="pt-3 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => console.log('Iniciar viagem:', viagem.id)}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Iniciar Viagem
                      </Button>
                    </div>
                  )}

                  {viagem.status === 'EM_ANDAMENTO' && (
                    <div className="pt-3 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => console.log('Finalizar viagem:', viagem.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Finalizar Viagem
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredViagens.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma viagem encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'TODAS'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando sua primeira viagem'
                }
              </p>
              {!searchTerm && statusFilter === 'TODAS' && (
                <Button onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Viagem
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}