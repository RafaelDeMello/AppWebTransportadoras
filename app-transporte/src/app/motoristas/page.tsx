'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MotoristaForm } from '../../components/forms/MotoristaForm'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Phone, 
  CreditCard,
  Building2,
  Route,
  CheckCircle
} from 'lucide-react'

// Tipos
interface Motorista {
  id: string
  nome: string
  cpf: string
  cnh: string
  telefone: string
  transportadoraNome: string
  transportadoraId: string
  viagensFinalizadas: number
  viagensAtivas: number
  status: 'ATIVO' | 'INATIVO'
  createdAt: string
}

interface MotoristaFormData {
  nome: string
  cpf: string
  cnh: string
  telefone?: string
  endereco?: string
  dataNascimento?: string
  transportadoraId: string
  status: 'ATIVO' | 'INATIVO'
}

// Mock data
const mockMotoristas: Motorista[] = [
  {
    id: '1',
    nome: 'João Silva Santos',
    cpf: '123.456.789-00',
    cnh: '12345678900',
    telefone: '(11) 9 8765-4321',
    transportadoraNome: 'Transportes São Paulo Ltda',
    transportadoraId: 'transp1',
    viagensFinalizadas: 45,
    viagensAtivas: 2,
    status: 'ATIVO',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    nome: 'Maria Santos Costa',
    cpf: '987.654.321-00',
    cnh: '98765432100',
    telefone: '(11) 9 1234-5678',
    transportadoraNome: 'Transportes São Paulo Ltda',
    transportadoraId: 'transp1',
    viagensFinalizadas: 78,
    viagensAtivas: 1,
    status: 'ATIVO',
    createdAt: '2024-02-10'
  },
  {
    id: '3',
    nome: 'Pedro Oliveira Lima',
    cpf: '456.789.123-00',
    cnh: '45678912300',
    telefone: '(51) 9 5555-6666',
    transportadoraNome: 'Logística Rio Grande',
    transportadoraId: 'transp2',
    viagensFinalizadas: 32,
    viagensAtivas: 0,
    status: 'INATIVO',
    createdAt: '2024-03-05'
  },
  {
    id: '4',
    nome: 'Ana Paula Ferreira',
    cpf: '789.123.456-00',
    cnh: '78912345600',
    telefone: '(31) 9 7777-8888',
    transportadoraNome: 'Express Minas Gerais',
    transportadoraId: 'transp3',
    viagensFinalizadas: 56,
    viagensAtivas: 3,
    status: 'ATIVO',
    createdAt: '2024-01-20'
  }
]

// Mock transportadoras
const mockTransportadoras = [
  { id: 'transp1', nomeFantasia: 'Transportes São Paulo Ltda' },
  { id: 'transp2', nomeFantasia: 'Logística Rio Grande' },
  { id: 'transp3', nomeFantasia: 'Express Minas Gerais' }
]

export default function MotoristasPage() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMotorista, setEditingMotorista] = useState<Motorista | null>(null)

  // Carregar dados da API
  useEffect(() => {
    const loadMotoristas = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/motoristas')
        if (response.ok) {
          const data = await response.json()
          // Mapear os dados da API para o formato esperado
          const mappedData = data.map((m: {
            id: string;
            nome: string;
            cpf: string;
            cnh: string;
            telefone: string;
            transportadora: { id: string; nome: string };
            _count?: { viagens: number };
            createdAt: string;
          }) => ({
            id: m.id,
            nome: m.nome,
            cpf: m.cpf,
            cnh: m.cnh,
            telefone: m.telefone,
            transportadoraNome: m.transportadora.nome,
            transportadoraId: m.transportadora.id,
            viagensFinalizadas: m._count?.viagens || 0,
            viagensAtivas: 0, // Será calculado posteriormente se necessário
            status: 'ATIVO', // Default para agora
            createdAt: new Date(m.createdAt).toLocaleDateString('pt-BR')
          }))
          setMotoristas(mappedData)
        } else {
          console.error('Erro ao carregar motoristas:', response.statusText)
          // Em caso de erro, usar dados mock temporariamente
          setMotoristas(mockMotoristas)
        }
      } catch (error) {
        console.error('Erro ao carregar motoristas:', error)
        // Em caso de erro, usar dados mock temporariamente
        setMotoristas(mockMotoristas)
      } finally {
        setIsLoading(false)
      }
    }

    loadMotoristas()
  }, [])

  // Filtrar motoristas
  const filteredMotoristas = motoristas.filter(motorista => {
    const matchesSearch = 
      motorista.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motorista.cpf.includes(searchTerm) ||
      motorista.cnh.includes(searchTerm) ||
      motorista.telefone.includes(searchTerm) ||
      motorista.transportadoraNome.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'TODOS' || motorista.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleEdit = (id: string) => {
    const motorista = motoristas.find(m => m.id === id)
    if (motorista) {
      setEditingMotorista(motorista)
      setIsFormOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este motorista?')) {
      try {
        const response = await fetch(`/api/motoristas/${id}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          setMotoristas(prev => prev.filter(m => m.id !== id))
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao excluir motorista')
        }
      } catch (error) {
        console.error('Erro ao excluir motorista:', error)
        alert('Erro ao excluir motorista')
      }
    }
  }

  const handleAdd = () => {
    setEditingMotorista(null)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (formData: MotoristaFormData) => {
    try {
      if (editingMotorista) {
        // Editar motorista existente
        const response = await fetch(`/api/motoristas/${editingMotorista.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          const updatedMotorista = await response.json()
          setMotoristas(prev => 
            prev.map(m => 
              m.id === editingMotorista.id 
                ? { 
                    id: updatedMotorista.id,
                    nome: updatedMotorista.nome,
                    cpf: updatedMotorista.cpf,
                    cnh: updatedMotorista.cnh,
                    telefone: updatedMotorista.telefone,
                    transportadoraNome: updatedMotorista.transportadora.nome,
                    transportadoraId: updatedMotorista.transportadora.id,
                    viagensFinalizadas: m.viagensFinalizadas,
                    viagensAtivas: m.viagensAtivas,
                    status: m.status,
                    createdAt: m.createdAt
                  }
                : m
            )
          )
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao atualizar motorista')
          return
        }
      } else {
        // Adicionar novo motorista
        const response = await fetch('/api/motoristas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          const newMotorista = await response.json()
          const mappedMotorista: Motorista = {
            id: newMotorista.id,
            nome: newMotorista.nome,
            cpf: newMotorista.cpf,
            cnh: newMotorista.cnh,
            telefone: newMotorista.telefone,
            transportadoraNome: newMotorista.transportadora.nome,
            transportadoraId: newMotorista.transportadora.id,
            viagensFinalizadas: 0,
            viagensAtivas: 0,
            status: 'ATIVO',
            createdAt: new Date(newMotorista.createdAt).toLocaleDateString('pt-BR')
          }
          setMotoristas(prev => [...prev, mappedMotorista])
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao criar motorista')
          return
        }
      }
      setIsFormOpen(false)
      setEditingMotorista(null)
    } catch (error) {
      console.error('Erro ao salvar motorista:', error)
      alert('Erro ao salvar motorista')
    }
  }

  const handleToggleStatus = (id: string) => {
    setMotoristas(prev => 
      prev.map(m => 
        m.id === id 
          ? { ...m, status: m.status === 'ATIVO' ? 'INATIVO' : 'ATIVO' as const }
          : m
      )
    )
  }

  const getStatusColor = (status: string) => {
    return status === 'ATIVO' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
  }

  const getTotalStats = () => {
    return {
      total: motoristas.length,
      ativos: motoristas.filter(m => m.status === 'ATIVO').length,
      viagensAtivas: motoristas.reduce((acc, m) => acc + m.viagensAtivas, 0),
      viagensFinalizadas: motoristas.reduce((acc, m) => acc + m.viagensFinalizadas, 0)
    }
  }

  const stats = getTotalStats()

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              Motoristas
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie os motoristas da transportadora
            </p>
          </div>
          <Button onClick={handleAdd} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Motorista
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, CPF, CNH, telefone ou transportadora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {(['TODOS', 'ATIVO', 'INATIVO'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'TODOS' ? 'Todos' : status === 'ATIVO' ? 'Ativos' : 'Inativos'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Viagens Ativas</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.viagensAtivas}</p>
                </div>
                <Route className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Encontrados</p>
                  <p className="text-2xl font-bold">{filteredMotoristas.length}</p>
                </div>
                <Search className="h-8 w-8 text-purple-600" />
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

        {/* Lista de Motoristas */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMotoristas.map((motorista) => (
              <Card key={motorista.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {motorista.nome}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(motorista.status)}`}>
                          {motorista.status}
                        </span>
                      </CardTitle>
                      <CardDescription>CPF: {motorista.cpf}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(motorista.id)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(motorista.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span>CNH: {motorista.cnh}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{motorista.telefone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span className="truncate">{motorista.transportadoraNome}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Viagens Ativas</p>
                      <p className="font-semibold text-orange-600">{motorista.viagensAtivas}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Finalizadas</p>
                      <p className="font-semibold text-blue-600">{motorista.viagensFinalizadas}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <Button
                      variant={motorista.status === 'ATIVO' ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleToggleStatus(motorista.id)}
                      className="w-full"
                    >
                      {motorista.status === 'ATIVO' ? 'Desativar' : 'Ativar'} Motorista
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredMotoristas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum motorista encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'TODOS'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando seu primeiro motorista'
                }
              </p>
              {!searchTerm && statusFilter === 'TODOS' && (
                <Button onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Motorista
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulário Modal */}
      <MotoristaForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        motorista={editingMotorista ? {
          ...editingMotorista,
          telefone: editingMotorista.telefone || '',
          endereco: '',
          dataNascimento: ''
        } : undefined}
        transportadoras={mockTransportadoras}
      />
    </Layout>
  )
}