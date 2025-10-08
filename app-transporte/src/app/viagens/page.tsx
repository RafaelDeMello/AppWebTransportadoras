'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/lib/UserContext'
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
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Route as RouteIcon
} from 'lucide-react'
import { ViagemForm } from '@/components/forms/ViagemForm'

// Tipos
interface ViagemItem {
  id: string
  descricao: string
  dataInicio: string
  dataFim?: string | null
  status: 'PLANEJADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA'
  motorista?: { id: string; nome: string }
  transportadora?: { id: string; nome: string }
  totalReceitas?: number
  totalDespesas?: number
  lucro?: number
  createdAt: string
}

export default function ViagensPage() {
  const [formattedDates, setFormattedDates] = useState<Record<string, { inicio: string; fim?: string }>>({})
  const { userInfo } = useUser()
  const [viagens, setViagens] = useState<ViagemItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'PLANEJADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA'>('TODAS')
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // useEffect para formatar datas (deve vir após a declaração de viagens)
    useEffect(() => {
      const dates: Record<string, { inicio: string; fim?: string }> = {}
      viagens.forEach(v => {
        dates[v.id] = {
          inicio: v.dataInicio ? new Date(v.dataInicio).toLocaleDateString('pt-BR') : '',
          fim: v.dataFim ? new Date(v.dataFim).toLocaleDateString('pt-BR') : undefined
        }
      })
      setFormattedDates(dates)
    }, [viagens])
  

  // Carregar dados da API
  useEffect(() => {
    const loadData = async () => {
      if (!userInfo) return
      
      setIsLoading(true)
      try {
        // Carregar viagens (filtrando por motorista se necessário)
        let viagensUrl = '/api/viagens'
        if (userInfo.role === 'MOTORISTA' && userInfo.motorista?.id) {
          viagensUrl += `?motoristaId=${userInfo.motorista.id}`
        }

        const response = await fetch(viagensUrl)
        if (response.ok) {
          const data = await response.json()
          setViagens(data)
        } else {
          console.error('Erro ao carregar viagens:', response.statusText)
          setViagens([])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setViagens([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [userInfo])

  // Filtrar viagens
  const filteredViagens = viagens.filter((v) => {
    const matchesSearch = (
      v.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.motorista?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.transportadora?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const matchesStatus = statusFilter === 'TODAS' || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleEdit = (id: string) => {
    console.log('Editar viagem:', id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta viagem?')) return
    try {
      const res = await fetch(`/api/viagens/${id}`, { method: 'DELETE' })
      if (res.ok) setViagens((prev) => prev.filter((v) => v.id !== id))
      else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Não foi possível excluir a viagem')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAdd = () => {
  setShowForm(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANEJADA':
        return 'text-blue-600 bg-blue-100'
      case 'EM_ANDAMENTO':
        return 'text-orange-600 bg-orange-100'
      case 'FINALIZADA':
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
      case 'FINALIZADA':
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
      case 'FINALIZADA':
        return 'Finalizada'
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
      finalizadas: viagens.filter(v => v.status === 'FINALIZADA').length,
      faturamento: viagens.reduce((acc, v) => acc + (v.totalReceitas || 0), 0),
      lucro: viagens.reduce((acc, v) => acc + (v.lucro || 0), 0),
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
          {userInfo?.role === 'MOTORISTA' && (
            <Button onClick={handleAdd} className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Viagem
            </Button>
          )}
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
                {(['TODAS', 'PLANEJADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {getStatusText(status === 'TODAS' ? 'TODAS' : status)}
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
                  <p className="text-sm font-medium text-gray-600">Finalizadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.finalizadas}</p>
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
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.faturamento)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lucro</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(stats.lucro)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-700" />
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
                        {viagem.descricao}
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
                      <DollarSign className="h-4 w-4" />
                      <span>Receitas: <span className="font-semibold text-emerald-600">{formatCurrency(viagem.totalReceitas || 0)}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>Despesas: <span className="font-semibold text-red-600">{formatCurrency(viagem.totalDespesas || 0)}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <DollarSign className="h-4 w-4" />
                      <span>Lucro: <span className={`font-semibold ${ (viagem.lucro || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(viagem.lucro || 0)}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Início: {formattedDates[viagem.id]?.inicio}
                      {formattedDates[viagem.id]?.fim && ` | Fim: ${formattedDates[viagem.id].fim}`}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>Motorista:</strong> {viagem.motorista?.nome || 'N/A'}</p>
                    <p><strong>Transportadora:</strong> {viagem.transportadora?.nome || 'N/A'}</p>
                  </div>

                  {viagem.status === 'PLANEJADA' && null}

                  {viagem.status === 'EM_ANDAMENTO' && (
                    <div className="pt-3 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/viagens/${viagem.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'FINALIZADA', dataFim: new Date().toISOString() })
                            })
                            if (res.ok) {
                              const updated = await res.json()
                              setViagens(prev => prev.map(v => v.id === viagem.id ? updated : v))
                            }
                          } catch (e) { console.error(e) }
                        }}
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
                  : 'Comece adicionando sua primeira viagem'}
              </p>
              {!searchTerm && statusFilter === 'TODAS' && userInfo?.role === 'MOTORISTA' && (
                <Button onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Viagem
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {/* Modal Formulário de Viagem */}
      {showForm && userInfo?.role === 'MOTORISTA' && (
        <ViagemForm
          onSave={async (data) => {
            setFormLoading(true)
            try {
              // Converter datas para formato ISO
              const dataInicioISO = data.dataInicio ? new Date(data.dataInicio).toISOString() : undefined
              const dataFimISO = data.dataFim ? new Date(data.dataFim).toISOString() : undefined
              const res = await fetch('/api/viagens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data,
                  dataInicio: dataInicioISO,
                  dataFim: dataFimISO,
                  motoristaId: userInfo.motorista?.id,
                  transportadoraId: userInfo.transportadora?.id
                })
              })
              if (res.ok) {
                const novaViagem = await res.json()
                setViagens(prev => [novaViagem, ...prev])
                setShowForm(false)
              } else {
                const err = await res.json().catch(() => ({}))
                alert(err.error || 'Erro ao cadastrar viagem')
              }
            } catch (error) {
              alert('Erro ao cadastrar viagem')
            } finally {
              setFormLoading(false)
            }
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </Layout>
  )
}