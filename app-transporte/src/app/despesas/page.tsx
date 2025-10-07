'use client'

import React, { useEffect, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DespesaForm, DespesaFormData } from '../../components/forms/DespesaForm'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Receipt,
  Calendar,
  TrendingDown,
  Filter,
  Download,
  AlertTriangle
} from 'lucide-react'

interface Despesa {
  id: string
  descricao: string
  valor: number
  createdAt: string
  viagemId: string
  viagem?: { id: string; descricao: string }
}

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null)
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

  // Buscar despesas da API ao carregar a página
  useEffect(() => {
    async function fetchDespesas() {
      try {
        const res = await fetch('/api/despesas')
        if (res.ok) {
          const data = await res.json()
          setDespesas(data)
        }
      } catch (error) {
        console.error('Erro ao buscar despesas:', error)
      }
    }
    fetchDespesas()
  }, [])

  // Filtros
  const filteredDespesas = despesas.filter(despesa => {
    const matchesSearch = despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.viagem?.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Estatísticas
  const totalDespesas = despesas.reduce((sum, despesa) => sum + despesa.valor, 0)
  const despesasDoMes = despesas.filter(despesa => {
    const dataDespesa = new Date(despesa.createdAt)
    const hoje = new Date()
    return dataDespesa.getMonth() === hoje.getMonth() && 
           dataDespesa.getFullYear() === hoje.getFullYear()
  })
  const totalMes = despesasDoMes.reduce((sum, despesa) => sum + despesa.valor, 0)

  // Categoria com maior gasto
  // Categoria removida do schema; manter métricas simples

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Categoria removida; sem badge

  const handleEdit = (despesa: Despesa) => {
    setEditingDespesa(despesa)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    const despesa = despesas.find(d => d.id === id)
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Despesa',
      description: `Tem certeza que deseja excluir a despesa "${despesa?.descricao}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/despesas/${id}`, { method: 'DELETE' })
          if (res.ok) setDespesas(prev => prev.filter(d => d.id !== id))
        } catch (e) { console.error(e) }
      }
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleNewDespesa = () => {
    setEditingDespesa(null)
    setShowForm(true)
  }

  const handleSaveDespesa = async (formData: DespesaFormData) => {
    try {
      if (editingDespesa) {
        const res = await fetch(`/api/despesas/${editingDespesa.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            descricao: formData.descricao,
            valor: parseFloat(formData.valor),
            viagemId: formData.viagem_id,
          })
        })
        if (res.ok) {
          const updated = await res.json()
          setDespesas(prev => prev.map(d => d.id === editingDespesa.id ? updated : d))
        }
      } else {
        const res = await fetch('/api/despesas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            descricao: formData.descricao,
            valor: parseFloat(formData.valor),
            viagemId: formData.viagem_id,
          })
        })
        if (res.ok) {
          const created = await res.json()
          setDespesas(prev => [created, ...prev])
        }
      }
      
      setShowForm(false)
      setEditingDespesa(null)
    } catch (error) {
      console.error('Erro ao salvar despesa:', error)
      throw error
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingDespesa(null)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Despesas</h1>
            <p className="text-gray-600 mt-1">Controle os gastos da transportadora</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleNewDespesa} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Despesas
              </CardTitle>
              <Receipt className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalDespesas)}
              </div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                {despesas.length} despesas cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Despesas do Mês
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalMes)}
              </div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                {despesasDoMes.length} despesas este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Média por Despesa
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(despesas.length > 0 ? totalDespesas / despesas.length : 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Valor médio das despesas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Maior Despesa
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {despesas.length > 0 ? formatCurrency(Math.max(...despesas.map(d => d.valor))) : 'N/A'}
              </div>
              <p className="text-xs text-gray-600 mt-1">Maior valor registrado</p>
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
                    placeholder="Buscar por descrição, transportadora ou fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {/* Filtro por categoria removido (não faz parte do schema) */}
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Mais Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Despesas List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Despesas ({filteredDespesas.length})
            </CardTitle>
            <CardDescription>
              Lista de todas as despesas cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDespesas.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Nenhuma despesa encontrada
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || selectedCategoria 
                      ? 'Tente ajustar os filtros de busca.' 
                      : 'Comece cadastrando uma nova despesa.'}
                  </p>
                </div>
              ) : (
                filteredDespesas.map((despesa) => (
                  <div
                    key={despesa.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{despesa.descricao}</h3>
                        {/* Categoria removida */}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Data: {formatDate(despesa.createdAt)}</p>
                        {despesa.viagem && (
                          <p>Viagem: {despesa.viagem.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          -{formatCurrency(despesa.valor)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(despesa)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(despesa.id)}
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

      {/* Modal Form */}
      {showForm && (
        <DespesaForm
          despesa={editingDespesa as unknown as {
            id: string
            descricao: string
            valor: number
            data: string
            categoria: string
            viagem_id?: string
            transportadora_id: string
            fornecedor?: string
            created_at: string
          }}
          onSave={async (data: DespesaFormData) => {
            await handleSaveDespesa(data)
          }}
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