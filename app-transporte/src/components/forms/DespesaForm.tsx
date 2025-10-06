'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save } from 'lucide-react'

export interface DespesaFormData {
  descricao: string
  valor: string
  data: string
  categoria: string
  viagem_id?: string
  transportadora_id: string
  fornecedor?: string
}

interface Despesa {
  id: string
  descricao: string
  valor: number
  data: string
  categoria: string
  viagem_id?: string
  transportadora_id: string
  fornecedor?: string
  created_at: string
}

interface DespesaFormProps {
  despesa?: Despesa | null
  onSave: (data: DespesaFormData) => Promise<void>
  onCancel: () => void
}

const categorias = [
  { value: 'COMBUSTIVEL', label: 'Combustível' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'PEDAGIO', label: 'Pedágio' },
  { value: 'HOSPEDAGEM', label: 'Hospedagem' },
  { value: 'ALIMENTACAO', label: 'Alimentação' },
  { value: 'SEGURO', label: 'Seguro' },
  { value: 'MULTA', label: 'Multa' },
  { value: 'OUTROS', label: 'Outros' }
]

// Mock data para transportadoras
const mockTransportadoras = [
  { id: '1', nome: 'TransLog Express' },
  { id: '2', nome: 'Rodoviária Sul' },
  { id: '3', nome: 'CargoFast' }
]

// Mock data para viagens
const mockViagens = [
  { id: '1', origem: 'São Paulo', destino: 'Rio de Janeiro' },
  { id: '2', origem: 'Belo Horizonte', destino: 'Salvador' },
  { id: '3', origem: 'Curitiba', destino: 'Florianópolis' }
]

export function DespesaForm({ despesa, onSave, onCancel }: DespesaFormProps) {
  const [formData, setFormData] = useState<DespesaFormData>({
    descricao: despesa?.descricao || '',
    valor: despesa?.valor?.toString() || '',
    data: despesa?.data || new Date().toISOString().split('T')[0],
    categoria: despesa?.categoria || 'COMBUSTIVEL',
    viagem_id: despesa?.viagem_id || '',
    transportadora_id: despesa?.transportadora_id || '1',
    fornecedor: despesa?.fornecedor || ''
  })

  const [errors, setErrors] = useState<Partial<DespesaFormData>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<DespesaFormData> = {}

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória'
    }

    if (!formData.valor.trim()) {
      newErrors.valor = 'Valor é obrigatório'
    } else {
      const valor = parseFloat(formData.valor.replace(',', '.'))
      if (isNaN(valor) || valor <= 0) {
        newErrors.valor = 'Valor deve ser um número positivo'
      }
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória'
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória'
    }

    if (!formData.transportadora_id) {
      newErrors.transportadora_id = 'Transportadora é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Erro ao salvar despesa:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof DespesaFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{despesa ? 'Editar Despesa' : 'Nova Despesa'}</CardTitle>
            <CardDescription>
              {despesa ? 'Edite as informações da despesa' : 'Cadastre uma nova despesa'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Descrição */}
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Combustível - Posto Shell"
                className={errors.descricao ? 'border-red-500' : ''}
              />
              {errors.descricao && (
                <p className="text-sm text-red-500 mt-1">{errors.descricao}</p>
              )}
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', e.target.value)}
                  placeholder="0,00"
                  className={errors.valor ? 'border-red-500' : ''}
                />
                {errors.valor && (
                  <p className="text-sm text-red-500 mt-1">{errors.valor}</p>
                )}
              </div>

              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange('data', e.target.value)}
                  className={errors.data ? 'border-red-500' : ''}
                />
                {errors.data && (
                  <p className="text-sm text-red-500 mt-1">{errors.data}</p>
                )}
              </div>
            </div>

            {/* Categoria e Fornecedor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <select
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                    errors.categoria ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {categorias.map(categoria => (
                    <option key={categoria.value} value={categoria.value} className="text-gray-900 bg-white">
                      {categoria.label}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="text-sm text-red-500 mt-1">{errors.categoria}</p>
                )}
              </div>

              <div>
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                  placeholder="Ex: Posto Shell, Oficina Central"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Nome do estabelecimento ou prestador (opcional)
                </p>
              </div>
            </div>

            {/* Transportadora */}
            <div>
              <Label htmlFor="transportadora_id">Transportadora *</Label>
              <select
                id="transportadora_id"
                value={formData.transportadora_id}
                onChange={(e) => handleInputChange('transportadora_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                  errors.transportadora_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="" className="text-gray-900 bg-white">Selecione uma transportadora</option>
                {mockTransportadoras.map(transportadora => (
                  <option key={transportadora.id} value={transportadora.id} className="text-gray-900 bg-white">
                    {transportadora.nome}
                  </option>
                ))}
              </select>
              {errors.transportadora_id && (
                <p className="text-sm text-red-500 mt-1">{errors.transportadora_id}</p>
              )}
            </div>

            {/* Viagem (opcional) */}
            <div>
              <Label htmlFor="viagem_id">Viagem (opcional)</Label>
              <select
                id="viagem_id"
                value={formData.viagem_id}
                onChange={(e) => handleInputChange('viagem_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="" className="text-gray-900 bg-white">Não vinculada a viagem</option>
                {mockViagens.map(viagem => (
                  <option key={viagem.id} value={viagem.id} className="text-gray-900 bg-white">
                    {viagem.origem} → {viagem.destino}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Vincule esta despesa a uma viagem específica (opcional)
              </p>
            </div>
          </CardContent>

          <div className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}