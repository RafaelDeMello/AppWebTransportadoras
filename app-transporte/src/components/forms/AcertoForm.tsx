'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save } from 'lucide-react'

export interface AcertoFormData {
  descricao: string
  valor: string
  data: string
  tipo: 'COMISSAO' | 'DESCONTO' | 'BONUS' | 'AJUSTE'
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO'
  motorista_id: string
  viagem_id?: string
  transportadora_id: string
  observacoes?: string
}

interface Acerto {
  id: string
  descricao: string
  valor: number
  data: string
  tipo: 'COMISSAO' | 'DESCONTO' | 'BONUS' | 'AJUSTE'
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO'
  motorista_id: string
  viagem_id?: string
  transportadora_id: string
  observacoes?: string
  created_at: string
}

interface AcertoFormProps {
  acerto?: Acerto | null
  onSave: (data: AcertoFormData) => Promise<void>
  onCancel: () => void
}

const tipos = [
  { value: 'COMISSAO', label: 'Comissão' },
  { value: 'DESCONTO', label: 'Desconto' },
  { value: 'BONUS', label: 'Bônus' },
  { value: 'AJUSTE', label: 'Ajuste' }
]

const statusOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'CANCELADO', label: 'Cancelado' }
]

interface Motorista {
  id: string
  nome: string
  cpf: string
}

interface Transportadora {
  id: string
  nome: string
}

interface Viagem {
  id: string
  origem: string
  destino: string
  valor_frete: number
}

export function AcertoForm({ acerto, onSave, onCancel }: AcertoFormProps) {
  const [formData, setFormData] = useState<AcertoFormData>({
    descricao: acerto?.descricao || '',
    valor: acerto?.valor?.toString() || '',
    data: acerto?.data || new Date().toISOString().split('T')[0],
    tipo: acerto?.tipo || 'COMISSAO',
    status: acerto?.status || 'PENDENTE',
    motorista_id: acerto?.motorista_id || '',
    viagem_id: acerto?.viagem_id || '',
    transportadora_id: acerto?.transportadora_id || '',
    observacoes: acerto?.observacoes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [isLoadingMotoristas, setIsLoadingMotoristas] = useState(false)
  const [isLoadingTransportadoras, setIsLoadingTransportadoras] = useState(false)
  const [isLoadingViagens, setIsLoadingViagens] = useState(false)

  const fetchMotoristas = useCallback(async () => {
    setIsLoadingMotoristas(true)
    try {
      const response = await fetch('/api/motoristas')
      if (!response.ok) {
        throw new Error('Erro ao carregar motoristas')
      }
      const data = await response.json()
      setMotoristas(data.map((m: Motorista) => ({
        id: m.id,
        nome: m.nome || '',
        cpf: m.cpf || ''
      })))
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error)
    } finally {
      setIsLoadingMotoristas(false)
    }
  }, [])

  const fetchTransportadoras = useCallback(async () => {
    setIsLoadingTransportadoras(true)
    try {
      const response = await fetch('/api/transportadoras')
      if (!response.ok) {
        throw new Error('Erro ao carregar transportadoras')
      }
      const data = await response.json()
      setTransportadoras(data.map((t: Transportadora) => ({
        id: t.id,
        nome: t.nome || ''
      })))
    } catch (error) {
      console.error('Erro ao buscar transportadoras:', error)
    } finally {
      setIsLoadingTransportadoras(false)
    }
  }, [])

  const fetchViagens = useCallback(async () => {
    setIsLoadingViagens(true)
    try {
      const response = await fetch('/api/viagens')
      if (!response.ok) {
        throw new Error('Erro ao carregar viagens')
      }
      const data = await response.json()
      setViagens(data.map((v: Viagem) => ({
        id: v.id,
        origem: v.origem || '',
        destino: v.destino || '',
        valor_frete: v.valor_frete || 0
      })))
    } catch (error) {
      console.error('Erro ao buscar viagens:', error)
    } finally {
      setIsLoadingViagens(false)
    }
  }, [])

  useEffect(() => {
    fetchMotoristas()
    fetchTransportadoras()
    fetchViagens()
  }, [])

    const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória'
    }
    
    if (!formData.valor.trim()) {
      newErrors.valor = 'Valor é obrigatório'
    } else {
      const valor = parseFloat(formData.valor.replace(',', '.'))
      if (isNaN(valor) || valor === 0) {
        newErrors.valor = 'Valor deve ser um número diferente de zero'
      }
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória'
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Tipo é obrigatório'
    }

    if (!formData.status) {
      newErrors.status = 'Status é obrigatório'
    }

    if (!formData.motorista_id) {
      newErrors.motorista_id = 'Motorista é obrigatório'
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
      console.error('Erro ao salvar acerto:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AcertoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  // Auto-preencher descrição baseada no tipo e viagem selecionada
  const handleTipoChange = (tipo: string) => {
    let descricao = formData.descricao
    const viagem = viagens.find(v => v.id === formData.viagem_id)
    
    if (!formData.descricao || formData.descricao.includes('Comissão') || formData.descricao.includes('Desconto') || formData.descricao.includes('Bônus') || formData.descricao.includes('Ajuste')) {
      switch (tipo) {
        case 'COMISSAO':
          descricao = viagem ? `Comissão - Viagem ${viagem.origem} → ${viagem.destino}` : 'Comissão'
          break
        case 'DESCONTO':
          descricao = 'Desconto'
          break
        case 'BONUS':
          descricao = 'Bônus'
          break
        case 'AJUSTE':
          descricao = 'Ajuste'
          break
      }
    }
    
    setFormData(prev => ({ ...prev, tipo: tipo as AcertoFormData['tipo'], descricao }))
  }

  const handleViagemChange = (viagemId: string) => {
    const viagem = viagens.find(v => v.id === viagemId)
    let descricao = formData.descricao
    
    if (formData.tipo === 'COMISSAO' && viagem) {
      descricao = `Comissão - Viagem ${viagem.origem} → ${viagem.destino}`
    }
    
    setFormData(prev => ({ ...prev, viagem_id: viagemId, descricao }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{acerto ? 'Editar Acerto' : 'Novo Acerto'}</CardTitle>
            <CardDescription>
              {acerto ? 'Edite as informações do acerto' : 'Cadastre um novo acerto financeiro'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Tipo e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => handleTipoChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                    errors.tipo ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {tipos.map(tipo => (
                    <option key={tipo.value} value={tipo.value} className="text-gray-900 bg-white">
                      {tipo.label}
                    </option>
                  ))}
                </select>
                {errors.tipo && (
                  <p className="text-sm text-red-500 mt-1">{errors.tipo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value} className="text-gray-900 bg-white">
                      {status.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="text-sm text-red-500 mt-1">{errors.status}</p>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Comissão - Viagem SP → RJ"
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
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', e.target.value)}
                  placeholder="0,00"
                  className={errors.valor ? 'border-red-500' : ''}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use valores negativos para descontos
                </p>
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

            {/* Motorista e Transportadora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="motorista_id">Motorista *</Label>
                <select
                  id="motorista_id"
                  value={formData.motorista_id}
                  onChange={(e) => handleInputChange('motorista_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                    errors.motorista_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoadingMotoristas}
                >
                  <option value="">Selecione um motorista</option>
                  {isLoadingMotoristas ? (
                    <option value="" disabled>Carregando motoristas...</option>
                  ) : (
                    motoristas.map((motorista) => (
                      <option key={motorista.id} value={motorista.id}>
                        {motorista.nome} - {motorista.cpf}
                      </option>
                    ))
                  )}
                </select>
                {errors.motorista_id && (
                  <p className="text-sm text-red-500 mt-1">{errors.motorista_id}</p>
                )}
              </div>

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
            </div>

            {/* Viagem (opcional) */}
            <div>
              <Label htmlFor="viagem_id">Viagem (opcional)</Label>
              <select
                id="viagem_id"
                value={formData.viagem_id || ''}
                onChange={(e) => handleViagemChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                disabled={isLoadingViagens}
              >
                <option value="">Não vinculada a viagem</option>
                {isLoadingViagens ? (
                  <option value="" disabled>Carregando viagens...</option>
                ) : (
                  viagens.map((viagem) => (
                    <option key={viagem.id} value={viagem.id}>
                      {viagem.origem} → {viagem.destino} (R$ {viagem.valor_frete.toLocaleString('pt-BR')})
                    </option>
                  ))
                )}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Vincule este acerto a uma viagem específica (opcional)
              </p>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre o acerto..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Detalhes ou justificativas para o acerto (opcional)
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