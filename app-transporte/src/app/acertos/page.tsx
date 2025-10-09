'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/lib/UserContext'
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
  Clock
} from 'lucide-react'

interface Acerto {
  id: string
  valor: number
  pago: boolean
  createdAt: string
  viagemId: string
  viagem?: {
    id: string
    descricao: string
    transportadora: {
      id: string
      nome: string
    }
    motorista: {
      id: string
      nome: string
    }
    totalReceitas?: number
    totalDespesas?: number
    lucro?: number
  }
}

export default function AcertosPage() {
  const { userInfo } = useUser()
  const [acertos, setAcertos] = useState<Acerto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showPaidOnly, setShowPaidOnly] = useState<boolean | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAcerto, setEditingAcerto] = useState<Acerto | null>(null)
  const [loading, setLoading] = useState(true)
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

  // Buscar acertos da API ao carregar a página
  useEffect(() => {
    async function fetchData() {
      if (!userInfo) return
      
      try {
        setLoading(true)
        
        const url = new URL('/api/acertos', window.location.origin)
        if (showPaidOnly !== null) {
          url.searchParams.set('pago', showPaidOnly.toString())
        }
        
  if (userInfo.type === 'MOTORISTA' && userInfo.motorista?.id) {
          url.searchParams.set('motoristaId', userInfo.motorista.id)
        }
        
        const res = await fetch(url.toString())
        if (!res.ok) {
          throw new Error('Erro ao buscar acertos')
        }
        const data = await res.json()
        setAcertos(data)
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [showPaidOnly, userInfo])

  // Filtros
  const filteredAcertos = acertos.filter(acerto => {
    const matchesSearch = acerto.viagem?.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         acerto.viagem?.motorista?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         acerto.viagem?.transportadora?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Estatísticas
  const totalAcertos = acertos.reduce((sum, acerto) => sum + acerto.valor, 0)
  const acertosPendentes = acertos.filter(acerto => !acerto.pago)
  const totalPendente = acertosPendentes.reduce((sum, acerto) => sum + acerto.valor, 0)
  const acertosPagos = acertos.filter(acerto => acerto.pago)
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

  const handleEdit = (acerto: Acerto) => {
    setEditingAcerto(acerto)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    const acerto = acertos.find(a => a.id === id)
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Acerto',
      description: `Tem certeza que deseja excluir o acerto da viagem "${acerto?.viagem?.descricao}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/acertos/${id}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            setAcertos(acertos.filter(acerto => acerto.id !== id))
          }
        } catch (error) {
          console.error('Erro ao excluir acerto:', error)
        }
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
        // Editar acerto existente (implementar quando tiver a rota PUT)
        const res = await fetch(`/api/acertos/${editingAcerto.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            viagemId: formData.viagem_id,
            valor: parseFloat(formData.valor),
            pago: false
          })
        })
        
        if (res.ok) {
          const updatedAcerto = await res.json()
          setAcertos(acertos.map(acerto => 
            acerto.id === editingAcerto.id ? updatedAcerto : acerto
          ))
        }
      } else {
        // Criar novo acerto
        const res = await fetch('/api/acertos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            viagemId: formData.viagem_id,
            valor: parseFloat(formData.valor),
            pago: false
          })
        })
        
        if (res.ok) {
          const newAcerto = await res.json()
          setAcertos([newAcerto, ...acertos])
        }
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

  const handleUpdateStatus = async (id: string, pago: boolean) => {
    try {
      const res = await fetch(`/api/acertos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pago })
      })
      
      if (res.ok) {
        const updatedAcerto = await res.json()
        setAcertos(acertos.map(acerto => 
          acerto.id === id ? updatedAcerto : acerto
        ))
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando acertos...</div>
        </div>
      </Layout>
    )
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
            {userInfo?.type === 'MOTORISTA' && (
              <Button onClick={handleNewAcerto} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Acerto
              </Button>
            )}
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
                    placeholder="Buscar por viagem, motorista ou transportadora..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-40">
                <select
                  value={showPaidOnly === null ? '' : showPaidOnly.toString()}
                  onChange={(e) => setShowPaidOnly(e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-900 bg-white">Todos</option>
                  <option value="false" className="text-gray-900 bg-white">Pendentes</option>
                  <option value="true" className="text-gray-900 bg-white">Pagos</option>
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
                    {searchTerm || showPaidOnly !== null
                      ? 'Tente ajustar os filtros de busca.' 
                      : 'Comece cadastrando um novo acerto.'}
                  </p>
                </div>
              ) : (
                filteredAcertos.map((acerto) => (
                  <div
                    key={acerto.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">
                          Acerto - {acerto.viagem?.descricao || 'Viagem sem descrição'}
                        </h3>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            acerto.pago 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {acerto.pago ? (
                              <><CheckCircle className="h-3 w-3" /> Pago</>
                            ) : (
                              <><Clock className="h-3 w-3" /> Pendente</>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Data: {formatDate(acerto.createdAt)}</p>
                        {acerto.viagem && (
                          <>
                            <p>Motorista: {acerto.viagem.motorista.nome}</p>
                            <p>Transportadora: {acerto.viagem.transportadora.nome}</p>
                            <p>Viagem: {acerto.viagem.descricao}</p>
                            <p>Receitas: <span className="font-semibold text-emerald-600">{formatCurrency(acerto.viagem.totalReceitas || 0)}</span></p>
                            <p>Despesas: <span className="font-semibold text-red-600">{formatCurrency(acerto.viagem.totalDespesas || 0)}</span></p>
                            <p>Lucro: <span className={`font-semibold ${ (acerto.viagem.lucro || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(acerto.viagem.lucro || 0)}</span></p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${acerto.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {acerto.valor >= 0 ? '+' : ''}{formatCurrency(acerto.valor)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!acerto.pago && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(acerto.id, true)}
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
                ))
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