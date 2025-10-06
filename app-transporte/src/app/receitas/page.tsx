'use client'

import React, { useState } from 'react'
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
  data: string
  categoria: string
  viagem_id?: string
  transportadora_id: string
}

interface Receita {
  id: string
  descricao: string
  valor: number
  data: string
  categoria: string
  viagem_id?: string
  viagem?: {
    origem: string
    destino: string
  }
  transportadora_id: string
  transportadora?: {
    nome: string
  }
  created_at: string
}

const mockReceitas: Receita[] = [
  {
    id: '1',
    descricao: 'Frete - São Paulo → Rio de Janeiro',
    valor: 2500.00,
    data: '2024-10-05',
    categoria: 'FRETE',
    viagem_id: '1',
    viagem: {
      origem: 'São Paulo',
      destino: 'Rio de Janeiro'
    },
    transportadora_id: '1',
    transportadora: {
      nome: 'TransLog Express'
    },
    created_at: '2024-10-05T10:30:00Z'
  },
  {
    id: '2',
    descricao: 'Taxa de descarga',
    valor: 350.00,
    data: '2024-10-04',
    categoria: 'TAXA',
    transportadora_id: '1',
    transportadora: {
      nome: 'TransLog Express'
    },
    created_at: '2024-10-04T14:20:00Z'
  },
  {
    id: '3',
    descricao: 'Frete - Belo Horizonte → Salvador',
    valor: 3200.00,
    data: '2024-10-03',
    categoria: 'FRETE',
    viagem_id: '2',
    viagem: {
      origem: 'Belo Horizonte',
      destino: 'Salvador'
    },
    transportadora_id: '1',
    transportadora: {
      nome: 'TransLog Express'
    },
    created_at: '2024-10-03T09:15:00Z'
  },
  {
    id: '4',
    descricao: 'Bônus por prazo',
    valor: 500.00,
    data: '2024-10-02',
    categoria: 'BONUS',
    transportadora_id: '1',
    transportadora: {
      nome: 'TransLog Express'
    },
    created_at: '2024-10-02T16:45:00Z'
  }
]

const categorias = [
  { value: 'FRETE', label: 'Frete', color: 'bg-blue-100 text-blue-800' },
  { value: 'TAXA', label: 'Taxa', color: 'bg-green-100 text-green-800' },
  { value: 'BONUS', label: 'Bônus', color: 'bg-purple-100 text-purple-800' },
  { value: 'OUTROS', label: 'Outros', color: 'bg-gray-100 text-gray-800' }
]

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Buscar dados da API
  React.useEffect(() => {
    const fetchReceitas = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/receitas');
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
    
    fetchReceitas();
  }, []);

  // Filtros
  const filteredReceitas = receitas.filter(receita => {
    const matchesSearch = receita.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receita.transportadora?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria = !selectedCategoria || receita.categoria === selectedCategoria
    
    return matchesSearch && matchesCategoria
  })

  // Estatísticas
  const totalReceitas = receitas.reduce((sum, receita) => sum + receita.valor, 0)
  const receitasDoMes = receitas.filter(receita => {
    const dataReceita = new Date(receita.data)
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

  const getCategoriaStyle = (categoria: string) => {
    const cat = categorias.find(c => c.value === categoria)
    return cat?.color || 'bg-gray-100 text-gray-800'
  }

  const handleEdit = (receita: Receita) => {
    setEditingReceita(receita)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
      setReceitas(receitas.filter(receita => receita.id !== id))
    }
  }

  const handleNewReceita = () => {
    setEditingReceita(null)
    setShowForm(true)
  }

  const handleSaveReceita = async (formData: ReceitaFormData) => {
    try {
      if (editingReceita) {
        // Editar receita existente
        const updatedReceita: Receita = {
          ...editingReceita,
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          data: formData.data,
          categoria: formData.categoria,
          viagem_id: formData.viagem_id || undefined,
          transportadora_id: formData.transportadora_id
        }
        
        setReceitas(receitas.map(receita => 
          receita.id === editingReceita.id ? updatedReceita : receita
        ))
      } else {
        // Criar nova receita
        const newReceita: Receita = {
          id: Date.now().toString(),
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          data: formData.data,
          categoria: formData.categoria,
          viagem_id: formData.viagem_id || undefined,
          transportadora_id: formData.transportadora_id,
          created_at: new Date().toISOString()
        }
        
        setReceitas([newReceita, ...receitas])
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
              <div className="sm:w-48">
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-900 bg-white">Todas as categorias</option>
                  {categorias.map(categoria => (
                    <option key={categoria.value} value={categoria.value} className="text-gray-900 bg-white">
                      {categoria.label}
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
                    {searchTerm || selectedCategoria 
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoriaStyle(receita.categoria)}`}>
                          {categorias.find(c => c.value === receita.categoria)?.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Data: {formatDate(receita.data)}</p>
                        <p>Transportadora: {receita.transportadora?.nome}</p>
                        {receita.viagem && (
                          <p>Viagem: {receita.viagem.origem} → {receita.viagem.destino}</p>
                        )}
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
          receita={editingReceita}
          onSave={handleSaveReceita}
          onCancel={handleCancelForm}
        />
      )}
    </Layout>
  )
}