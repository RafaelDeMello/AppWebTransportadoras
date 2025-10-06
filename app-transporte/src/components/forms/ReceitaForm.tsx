'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save } from 'lucide-react'

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
  transportadora_id: string
  created_at: string
}

interface Transportadora {
  id: string;
  nome: string;
}

interface Transportadora {
  id: string;
  nome: string;
}

interface Viagem {
  id: string;
  origem: string;
  destino: string;
  valor_frete: number;
}

interface ReceitaFormProps {
  receita?: Receita | null
  onSave: (data: ReceitaFormData) => Promise<void>
  onCancel: () => void
}

const categorias = [
  { value: 'FRETE', label: 'Frete' },
  { value: 'TAXA', label: 'Taxa' },
  { value: 'BONUS', label: 'Bônus' },
  { value: 'OUTROS', label: 'Outros' }
]

export function ReceitaForm({ receita, onSave, onCancel }: ReceitaFormProps) {
  const [transportadoras, setTransportadoras] = useState<Array<{ id: string; nome: string }>>([])
  const [viagens, setViagens] = useState<Array<{ id: string; origem: string; destino: string }>>([])
  const [isLoadingTransportadoras, setIsLoadingTransportadoras] = useState(false)
  const [isLoadingViagens, setIsLoadingViagens] = useState(false)
  
  const [formData, setFormData] = useState<ReceitaFormData>({
    descricao: receita?.descricao || '',
    valor: receita?.valor?.toString() || '',
    data: receita?.data || new Date().toISOString().split('T')[0],
    categoria: receita?.categoria || 'FRETE',
    viagem_id: receita?.viagem_id || '',
    transportadora_id: receita?.transportadora_id || '1'
  })

  const [errors, setErrors] = useState<Partial<ReceitaFormData>>({})
  const [loading, setLoading] = useState(false)
  
  // Funções para buscar dados da API
  const fetchTransportadoras = useCallback(async () => {
    setIsLoadingTransportadoras(true);
    try {
      const response = await fetch('/api/transportadoras');
      if (response.ok) {
        const data = await response.json();
        setTransportadoras(data.map((t: Transportadora) => ({ 
          id: t.id, 
          nome: t.nome || ''
        })));
      } else {
        console.error('Erro ao carregar transportadoras:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar transportadoras:', error);
    } finally {
      setIsLoadingTransportadoras(false);
    }
  }, []);

  const fetchViagens = useCallback(async () => {
    setIsLoadingViagens(true);
    try {
      const response = await fetch('/api/viagens');
      if (response.ok) {
        const data = await response.json();
        setViagens(data.map((v: Viagem) => ({
          id: v.id,
          origem: v.origem || '',
          destino: v.destino || ''
        })));
      } else {
        console.error('Erro ao carregar viagens:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
    } finally {
      setIsLoadingViagens(false);
    }
  }, []);
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchTransportadoras();
    fetchViagens();
  }, [fetchTransportadoras, fetchViagens]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ReceitaFormData> = {}

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
      console.error('Erro ao salvar receita:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ReceitaFormData, value: string) => {
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
            <CardTitle>{receita ? 'Editar Receita' : 'Nova Receita'}</CardTitle>
            <CardDescription>
              {receita ? 'Edite as informações da receita' : 'Cadastre uma nova receita'}
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
                placeholder="Ex: Frete - São Paulo → Rio de Janeiro"
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

            {/* Categoria */}
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
                  disabled={isLoadingTransportadoras}
                >
                  <option value="">Selecione uma transportadora</option>
                  {isLoadingTransportadoras ? (
                    <option value="" disabled>Carregando transportadoras...</option>
                  ) : (
                    transportadoras.map((transportadora) => (
                      <option key={transportadora.id} value={transportadora.id}>
                        {transportadora.nome}
                      </option>
                    ))
                  )}
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
                value={formData.viagem_id || ''}
                onChange={(e) => handleInputChange('viagem_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                  errors.viagem_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoadingViagens}
              >
                <option value="">Selecione uma viagem (opcional)</option>
                {isLoadingViagens ? (
                  <option value="" disabled>Carregando viagens...</option>
                ) : (
                  viagens.map((viagem) => (
                    <option key={viagem.id} value={viagem.id}>
                      {viagem.origem} → {viagem.destino}
                    </option>
                  ))
                )}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Vincule esta receita a uma viagem específica (opcional)
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