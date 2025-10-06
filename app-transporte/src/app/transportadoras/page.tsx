'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TransportadoraForm } from '../../components/forms/TransportadoraForm'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Users,
  Truck
} from 'lucide-react'

// Tipos
interface Transportadora {
  id: string
  nome: string
  cnpj: string
  email?: string
  telefone?: string
  endereco?: string
  totalMotoristas?: number
  viagensAtivas?: number
  createdAt: string
}

// Mock data - posteriormente virá da API
const mockTransportadoras: Transportadora[] = [
  {
    id: '1',
    nome: 'Transportes São Paulo Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'contato@transsp.com.br',
    telefone: '(11) 9 8765-4321',
    endereco: 'Rua das Flores, 123 - São Paulo/SP',
    totalMotoristas: 25,
    viagensAtivas: 8,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    nome: 'Logística Rio Grande',
    cnpj: '98.765.432/0001-10',
    email: 'admin@logrio.com.br',
    telefone: '(51) 9 1234-5678',
    endereco: 'Av. Brasil, 456 - Porto Alegre/RS',
    totalMotoristas: 15,
    viagensAtivas: 5,
    createdAt: '2024-02-10'
  },
  {
    id: '3',
    nome: 'Express Minas Gerais',
    cnpj: '45.678.901/0001-23',
    email: 'contato@expressmg.com.br',
    telefone: '(31) 9 5555-6666',
    endereco: 'Rua Ouro Preto, 789 - Belo Horizonte/MG',
    totalMotoristas: 18,
    viagensAtivas: 12,
    createdAt: '2024-03-05'
  }
]

export default function TransportadorasPage() {
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransportadora, setEditingTransportadora] = useState<Transportadora | null>(null)
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

  // Carregar dados da API
  useEffect(() => {
    const loadTransportadoras = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/transportadoras')
        if (response.ok) {
          const data = await response.json()
          // Mapear os dados da API para o formato esperado
          const mappedData = data.map((t: {
            id: string;
            nome: string;
            cnpj: string;
            email?: string;
            telefone?: string;
            endereco?: string;
            _count?: { motoristas: number; viagens: number };
            createdAt: string;
          }) => ({
            id: t.id,
            nome: t.nome,
            cnpj: t.cnpj,
            email: t.email,
            telefone: t.telefone,
            endereco: t.endereco,
            totalMotoristas: t._count?.motoristas || 0,
            viagensAtivas: t._count?.viagens || 0,
            createdAt: new Date(t.createdAt).toLocaleDateString('pt-BR')
          }))
          setTransportadoras(mappedData)
        } else {
          console.error('Erro ao carregar transportadoras:', response.statusText)
          // Em caso de erro, usar dados mock temporariamente
          setTransportadoras(mockTransportadoras)
        }
      } catch (error) {
        console.error('Erro ao carregar transportadoras:', error)
        // Em caso de erro, usar dados mock temporariamente
        setTransportadoras(mockTransportadoras)
      } finally {
        setIsLoading(false)
      }
    }

    loadTransportadoras()
  }, [])

  // Filtrar transportadoras
  const filteredTransportadoras = transportadoras.filter(transportadora =>
    transportadora.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transportadora.cnpj.includes(searchTerm) ||
    (transportadora.email && transportadora.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleEdit = (id: string) => {
    const transportadora = transportadoras.find(t => t.id === id)
    if (transportadora) {
      setEditingTransportadora(transportadora)
      setShowForm(true)
    }
  }

  const handleDelete = async (id: string) => {
    const transportadora = transportadoras.find(t => t.id === id)
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Transportadora',
      description: `Tem certeza que deseja excluir a transportadora "${transportadora?.nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/transportadoras/${id}`, {
            method: 'DELETE',
          })
          
          if (response.ok) {
            setTransportadoras(prev => prev.filter(t => t.id !== id))
          } else {
            const error = await response.json()
            console.error('Erro ao excluir transportadora:', error.error)
            alert(error.error || 'Erro ao excluir transportadora')
          }
        } catch (error) {
          console.error('Erro ao excluir transportadora:', error)
          alert('Erro ao excluir transportadora')
        }
      }
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleAdd = () => {
    setEditingTransportadora(null)
    setShowForm(true)
  }

  const handleSave = async (formData: {
    nome: string
    cnpj: string
    email?: string
    telefone?: string
    endereco?: string
  }) => {
    try {
      if (editingTransportadora) {
        // Editar existente
        const response = await fetch(`/api/transportadoras/${editingTransportadora.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          const updatedTransportadora = await response.json()
          setTransportadoras(prev => 
            prev.map(t => 
              t.id === editingTransportadora.id 
                ? {
                    id: updatedTransportadora.id,
                    nome: updatedTransportadora.nome,
                    cnpj: updatedTransportadora.cnpj,
                    email: updatedTransportadora.email,
                    telefone: updatedTransportadora.telefone,
                    endereco: updatedTransportadora.endereco,
                    totalMotoristas: t.totalMotoristas,
                    viagensAtivas: t.viagensAtivas,
                    createdAt: t.createdAt
                  }
                : t
            )
          )
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao atualizar transportadora')
          return
        }
      } else {
        // Criar novo
        const response = await fetch('/api/transportadoras', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          const newTransportadora = await response.json()
          const mappedTransportadora = {
            id: newTransportadora.id,
            nome: newTransportadora.nome,
            cnpj: newTransportadora.cnpj,
            email: newTransportadora.email,
            telefone: newTransportadora.telefone,
            endereco: newTransportadora.endereco,
            totalMotoristas: 0,
            viagensAtivas: 0,
            createdAt: new Date(newTransportadora.createdAt).toLocaleDateString('pt-BR')
          }
          setTransportadoras(prev => [...prev, mappedTransportadora])
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao criar transportadora')
          return
        }
      }
      setShowForm(false)
      setEditingTransportadora(null)
    } catch (error) {
      console.error('Erro ao salvar transportadora:', error)
      alert('Erro ao salvar transportadora')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTransportadora(null)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              Transportadoras
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie as empresas de transporte do sistema
            </p>
          </div>
          <Button onClick={handleAdd} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Transportadora
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                  <p className="text-2xl font-bold">{transportadoras.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Motoristas</p>
                  <p className="text-2xl font-bold">
                    {transportadoras.reduce((acc, t) => acc + (t.totalMotoristas || 0), 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Viagens Ativas</p>
                  <p className="text-2xl font-bold">
                    {transportadoras.reduce((acc, t) => acc + (t.viagensAtivas || 0), 0)}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Encontradas</p>
                  <p className="text-2xl font-bold">{filteredTransportadoras.length}</p>
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

        {/* Lista de Transportadoras */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTransportadoras.map((transportadora) => (
              <Card key={transportadora.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{transportadora.nome}</CardTitle>
                      <CardDescription>CNPJ: {transportadora.cnpj}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(transportadora.id)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(transportadora.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {transportadora.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{transportadora.email}</span>
                    </div>
                  )}
                  
                  {transportadora.telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{transportadora.telefone}</span>
                    </div>
                  )}
                  
                  {transportadora.endereco && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{transportadora.endereco}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Motoristas</p>
                      <p className="font-semibold text-blue-600">{transportadora.totalMotoristas || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Viagens Ativas</p>
                      <p className="font-semibold text-green-600">{transportadora.viagensAtivas || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTransportadoras.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma transportadora encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca'
                  : 'Comece adicionando sua primeira transportadora'
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Transportadora
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Formulário */}
      <TransportadoraForm
        transportadora={editingTransportadora || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        isOpen={showForm}
      />

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