'use client'

import React, { useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AcertoForm, AcertoFormData } from '../../components/forms/AcertoForm'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calculator,
  TrendingUp,
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface Acerto {
  id: string
  descricao: string
  valor: number
  data: string
  tipo: 'COMISSAO' | 'DESCONTO' | 'BONUS' | 'AJUSTE'
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO'
  motorista_id: string
  motorista?: {
    nome: string
    cpf: string
  }
  viagem_id?: string
  viagem?: {
    origem: string
    destino: string
    valor_frete: number
  }
  transportadora_id: string
  transportadora?: {
    nome: string
  }
  observacoes?: string
  created_at: string
  paid_at?: string
}

const mockAcertos: Acerto[] = [
  {
    id: '1',
    descricao: 'Comissão - Viagem SP → RJ',
    valor: 750.00,
    data: '2024-10-05',
    tipo: 'COMISSAO',
    status: 'PAGO',
    motorista_id: '1',
    motorista: {
      nome: 'João Silva',
      cpf: '123.456.789-10'
    },
    viagem_id: '1',
    viagem: {
      origem: 'São Paulo',
      destino: 'Rio de Janeiro',
      valor_frete: 2500.00
    },
    transportadora_id: '1',
    transportadora: {
      nome: 'TransLog Express'
    },
    created_at: '2024-10-05T10:30:00Z',
    paid_at: '2024-10-05T16:20:00Z'
  },
  {
    id: '2',
    descricao: 'Desconto - Multa de trânsito',
    valor: -180.00,
    data: '2024-10-04',
    tipo: 'DESCONTO',
    status: 'PENDENTE',
    motorista_id: '2',
    motorista: {
      nome: 'Maria Santos',
      cpf: '987.654.321-00'
    },
    transportadora_id: '1',
    transportadora: {
      nome: 'TransLog Express'
    },
    observacoes: 'Multa por excesso de velocidade na Via Dutra',
    created_at: '2024-10-04T14:20:00Z'
  },
  {
    id: '3',
    descricao: 'Bônus por pontualidade',
    valor: 300.00,
    data: '2024-10-03',
    tipo: 'BONUS',
    status: 'PAGO',
    motorista_id: '1',
    motorista: {
      nome: 'João Silva',
      cpf: '123.456.789-10'
    },
    transportadora_id: '1',
    transportadora: {
      nome: 'TransLog Express'
    },
    observacoes: 'Entrega realizada com 1 dia de antecedência',
    created_at: '2024-10-03T09:15:00Z',
    paid_at: '2024-10-03T17:45:00Z'
  },
  {
    id: '4',
    descricao: 'Ajuste de combustível',
    valor: 150.00,
    data: '2024-10-02',
    tipo: 'AJUSTE',
    status: 'PENDENTE',
    motorista_id: '3',
    motorista: {
      nome: 'Pedro Costa',
      cpf: '456.789.123-45'
    },
    viagem_id: '3',
    viagem: {
      origem: 'Curitiba',
      destino: 'Florianópolis',
      valor_frete: 1800.00
    },
    transportadora_id: '1',
    transportadora: {
      nome: 'TransLog Express'
    },
    observacoes: 'Reembolso de diferença no preço do combustível',
    created_at: '2024-10-02T11:30:00Z'
  }
]

const tipos = [
  { value: 'COMISSAO', label: 'Comissão', color: 'bg-green-100 text-green-800' },
  { value: 'DESCONTO', label: 'Desconto', color: 'bg-red-100 text-red-800' },
  { value: 'BONUS', label: 'Bônus', color: 'bg-blue-100 text-blue-800' },
  { value: 'AJUSTE', label: 'Ajuste', color: 'bg-yellow-100 text-yellow-800' }
]

const statusOptions = [
  { value: 'PENDENTE', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'PAGO', label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: AlertCircle }
]

export default function AcertosPage() {
  const [acertos, setAcertos] = useState<Acerto[]>(mockAcertos)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingAcerto, setEditingAcerto] = useState<Acerto | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  })

  // Filtros
  const filteredAcertos = acertos.filter(acerto => {
    const matchesSearch = acerto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         acerto.motorista?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         acerto.transportadora?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = !selectedTipo || acerto.tipo === selectedTipo
    const matchesStatus = !selectedStatus || acerto.status === selectedStatus
    
    return matchesSearch && matchesTipo && matchesStatus
  })

  // Estatísticas
  const totalAcertos = acertos.reduce((sum, acerto) => sum + acerto.valor, 0)
  const acertosPendentes = acertos.filter(acerto => acerto.status === 'PENDENTE')
  const totalPendente = acertosPendentes.reduce((sum, acerto) => sum + acerto.valor, 0)
  const acertosPagos = acertos.filter(acerto => acerto.status === 'PAGO')
  const totalPago = acertosPagos.reduce((sum, acerto) => sum + acerto.valor, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getTipoStyle = (tipo: string) => {
    const tipoObj = tipos.find(t => t.value === tipo)
    return tipoObj?.color || 'bg-gray-100 text-gray-800'
  }

  const getTipoLabel = (tipo: string) => {
    const tipoObj = tipos.find(t => t.value === tipo)
    return tipoObj?.label || tipo
  }

  const getStatusStyle = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj?.label || status
  }

  const getStatusIcon = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj?.icon || Clock
  }

  const handleEdit = (acerto: Acerto) => {
    setEditingAcerto(acerto)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    const acerto = acertos.find(a => a.id === id)
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Acerto',
      description: `Tem certeza que deseja excluir o acerto "${acerto?.descricao}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        setAcertos(acertos.filter(acerto => acerto.id !== id))
      }
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleNewAcerto = () => {
    setEditingAcerto(null)
    setShowForm(true)
  }

  const handleSaveAcerto = async (formData: AcertoFormData) => {
    try {
      if (editingAcerto) {
        // Editar acerto existente
        const updatedAcerto: Acerto = {
          ...editingAcerto,
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          data: formData.data,
          tipo: formData.tipo,
          status: formData.status,
          motorista_id: formData.motorista_id,
          viagem_id: formData.viagem_id,
          transportadora_id: formData.transportadora_id,
          observacoes: formData.observacoes
        }
        
        setAcertos(acertos.map(acerto => 
          acerto.id === editingAcerto.id ? updatedAcerto : acerto
        ))
      } else {
        // Criar novo acerto
        const newAcerto: Acerto = {
          id: Date.now().toString(),
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          data: formData.data,
          tipo: formData.tipo,
          status: formData.status,
          motorista_id: formData.motorista_id,
          viagem_id: formData.viagem_id,
          transportadora_id: formData.transportadora_id,
          observacoes: formData.observacoes,
          created_at: new Date().toISOString()
        }
        
        setAcertos([newAcerto, ...acertos])
      }
      
      setShowForm(false)
      setEditingAcerto(null)
    } catch (error) {
      console.error('Erro ao salvar acerto:', error)
      throw error
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingAcerto(null)
  }

  const handleUpdateStatus = (id: string, newStatus: 'PENDENTE' | 'PAGO' | 'CANCELADO') => {
    setAcertos(acertos.map(acerto => {
      if (acerto.id === id) {
        return {
          ...acerto,
          status: newStatus,
          paid_at: newStatus === 'PAGO' ? new Date().toISOString() : undefined
        }
      }
      return acerto
    }))
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Acertos</h1>
            <p className="text-gray-600 mt-1">Gerencie os acertos financeiros com motoristas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleNewAcerto} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Acerto
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Acertos
              </CardTitle>
              <Calculator className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalAcertos)}
              </div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-blue-500 mr-1" />
                {acertos.length} acertos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Valores Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totalPendente)}
              </div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <Clock className="h-3 w-3 text-yellow-500 mr-1" />
                {acertosPendentes.length} acertos pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Valores Pagos
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPago)}
              </div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                {acertosPagos.length} acertos pagos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taxa de Pagamento
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {acertos.length > 0 ? Math.round((acertosPagos.length / acertos.length) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Acertos quitados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por descrição, motorista ou transportadora..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-40">
                <select
                  value={selectedTipo}
                  onChange={(e) => setSelectedTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-900 bg-white">Todos os tipos</option>
                  {tipos.map(tipo => (
                    <option key={tipo.value} value={tipo.value} className="text-gray-900 bg-white">
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:w-40">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-900 bg-white">Todos os status</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value} className="text-gray-900 bg-white">
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Mais Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acertos List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Acertos ({filteredAcertos.length})
            </CardTitle>
            <CardDescription>
              Lista de todos os acertos cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAcertos.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Nenhum acerto encontrado
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || selectedTipo || selectedStatus
                      ? 'Tente ajustar os filtros de busca.' 
                      : 'Comece cadastrando um novo acerto.'}
                  </p>
                </div>
              ) : (
                filteredAcertos.map((acerto) => {
                  const StatusIcon = getStatusIcon(acerto.status)
                  return (
                    <div
                      key={acerto.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{acerto.descricao}</h3>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoStyle(acerto.tipo)}`}>
                              {getTipoLabel(acerto.tipo)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusStyle(acerto.status)}`}>
                              <StatusIcon className="h-3 w-3" />
                              {getStatusLabel(acerto.status)}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Data: {formatDate(acerto.data)}</p>
                          <p>Motorista: {acerto.motorista?.nome}</p>
                          <p>Transportadora: {acerto.transportadora?.nome}</p>
                          {acerto.viagem && (
                            <p>Viagem: {acerto.viagem.origem} → {acerto.viagem.destino}</p>
                          )}
                          {acerto.observacoes && (
                            <p>Obs: {acerto.observacoes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${acerto.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {acerto.valor >= 0 ? '+' : ''}{formatCurrency(acerto.valor)}
                          </div>
                          {acerto.paid_at && (
                            <p className="text-xs text-gray-500">
                              Pago em {formatDate(acerto.paid_at)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {acerto.status === 'PENDENTE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(acerto.id, 'PAGO')}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(acerto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(acerto.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Acerto */}
      {showForm && (
        <AcertoForm
          acerto={editingAcerto}
          onSave={handleSaveAcerto}
          onCancel={handleCancelForm}
        />
      )}

      {/* Modal de Confirmação */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Layout>
  )
}