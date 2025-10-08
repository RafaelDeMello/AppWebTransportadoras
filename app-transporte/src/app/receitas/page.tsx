'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@/lib/UserContext'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReceitaForm } from '@/components/forms/ReceitaForm'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign,
  Calendar,
  TrendingUp,
  Filter,
  Download
} from 'lucide-react'

interface ReceitaFormData {
  descricao: string
  valor: string
  viagem_id?: string
}

interface Receita {
  id: string
  descricao: string
  valor: number
  createdAt: string
  viagemId: string
  viagem?: { id: string; descricao: string }
}

export default function ReceitasPage() {
  const { userInfo } = useUser()
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Buscar dados da API
  useEffect(() => {
    const fetchData = async () => {
      if (!userInfo) return
      
      setIsLoading(true);
      try {
        // Carregar receitas (filtrando por motorista se necessário)
        let receitasUrl = '/api/receitas'
        if (userInfo.role === 'MOTORISTA' && userInfo.motorista?.id) {
          receitasUrl += `?motoristaId=${userInfo.motorista.id}`
        }

        const response = await fetch(receitasUrl);
        if (response.ok) {
          const data = await response.json();
          setReceitas(data);
        } else {
          console.error('Erro ao carregar receitas:', response.statusText);
        }
      } catch (error) {
        console.error('Erro ao buscar receitas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userInfo]);

  // Filtros
  const filteredReceitas = receitas.filter(receita => {
    const matchesSearch = receita.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receita.viagem?.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Estatísticas
  const totalReceitas = receitas.reduce((sum, receita) => sum + receita.valor, 0)
  const receitasDoMes = receitas.filter(receita => {
    const dataReceita = new Date(receita.createdAt)
    const hoje = new Date()
    return dataReceita.getMonth() === hoje.getMonth() && 
           dataReceita.getFullYear() === hoje.getFullYear()
  })
  const totalMes = receitasDoMes.reduce((sum, receita) => sum + receita.valor, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Categoria removida; badge não é exibida

  const handleEdit = (receita: Receita) => {
    setEditingReceita(receita)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return
    try {
      const res = await fetch(`/api/receitas/${id}`, { method: 'DELETE' })
      if (res.ok) setReceitas(prev => prev.filter(r => r.id !== id))
    } catch (e) { console.error(e) }
  }

  const handleNewReceita = () => {
    setEditingReceita(null)
    setShowForm(true)
  }

  const handleSaveReceita = async (formData: ReceitaFormData) => {
    try {
      if (editingReceita) {
        const res = await fetch(`/api/receitas/${editingReceita.id}`, {
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
          setReceitas(prev => prev.map(r => r.id === editingReceita.id ? updated : r))
        }
      } else {
        const res = await fetch('/api/receitas', {
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
          setReceitas(prev => [created, ...prev])
        }
      }
      
      setShowForm(false)
      setEditingReceita(null)
    } catch (error) {
      console.error('Erro ao salvar receita:', error)
      throw error
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingReceita(null)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Receitas</h1>
            <p className="text-gray-600 mt-1">Gerencie as receitas da transportadora</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleNewReceita} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Receita
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Receitas
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalReceitas)}
              </div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                {receitas.length} receitas cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Receitas do Mês
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalMes)}
              </div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                {receitasDoMes.length} receitas este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Média por Receita
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(receitas.length > 0 ? totalReceitas / receitas.length : 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Valor médio das receitas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Maior Receita
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(Math.max(...receitas.map(r => r.valor)))}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Maior valor registrado
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
                    placeholder="Buscar por descrição ou transportadora..."
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

        {/* Receitas List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Receitas ({filteredReceitas.length})
            </CardTitle>
            <CardDescription>
              Lista de todas as receitas cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReceitas.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Nenhuma receita encontrada
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm 
                      ? 'Tente ajustar os filtros de busca.' 
                      : 'Comece cadastrando uma nova receita.'}
                  </p>
                </div>
              ) : (
                filteredReceitas.map((receita) => (
                  <div
                    key={receita.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{receita.descricao}</h3>
                        {/* Categoria removida do schema */}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Data: {formatDate(receita.createdAt)}</p>
                        {receita.viagem && <p>Viagem: {receita.viagem.descricao}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(receita.valor)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(receita)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(receita.id)}
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
        <ReceitaForm
          receita={editingReceita as unknown as { descricao?: string; valor?: number; viagem_id?: string; viagemId?: string }}
          onSave={async (data: { descricao: string; valor: string; viagem_id: string }) => {
            await handleSaveReceita({
              descricao: data.descricao,
              valor: data.valor,
              viagem_id: data.viagem_id,
            })
          }}
          onCancel={handleCancelForm}
        />
      )}
    </Layout>
  )
}