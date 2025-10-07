'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save } from 'lucide-react'

export interface AcertoFormData {
  valor: string
  viagem_id: string
}

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
  }
}

interface AcertoFormProps {
  acerto?: Acerto | null
  onSave: (data: AcertoFormData) => Promise<void>
  onCancel: () => void
}

interface Viagem {
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
}

export function AcertoForm({ acerto, onSave, onCancel }: AcertoFormProps) {
  const [formData, setFormData] = useState<AcertoFormData>({
    valor: acerto?.valor?.toString() || '',
    viagem_id: acerto?.viagemId || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [isLoadingViagens, setIsLoadingViagens] = useState(false)

  // Carregar viagens
  useEffect(() => {
    const fetchViagens = async () => {
      setIsLoadingViagens(true)
      try {
        const response = await fetch('/api/viagens')
        if (!response.ok) {
          throw new Error('Erro ao carregar viagens')
        }
        const data = await response.json()
        setViagens(data)
      } catch (error) {
        console.error('Erro ao carregar viagens:', error)
      } finally {
        setIsLoadingViagens(false)
      }
    }

    fetchViagens()
  }, [])

  const handleInputChange = (name: keyof AcertoFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.valor.trim()) {
      newErrors.valor = 'Valor é obrigatório'
    } else if (isNaN(parseFloat(formData.valor))) {
      newErrors.valor = 'Valor deve ser um número válido'
    } else if (parseFloat(formData.valor) === 0) {
      newErrors.valor = 'Valor deve ser diferente de zero'
    }

    if (!formData.viagem_id) {
      newErrors.viagem_id = 'Viagem é obrigatória'
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">
              {acerto ? 'Editar Acerto' : 'Novo Acerto'}
            </CardTitle>
            <CardDescription>
              {acerto ? 'Edite as informações do acerto' : 'Preencha as informações para criar um novo acerto'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Viagem */}
            <div className="space-y-2">
              <Label htmlFor="viagem_id">
                Viagem *
              </Label>
              <select
                id="viagem_id"
                value={formData.viagem_id}
                onChange={(e) => handleInputChange('viagem_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.viagem_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoadingViagens}
              >
                <option value="">
                  {isLoadingViagens ? 'Carregando viagens...' : 'Selecione uma viagem'}
                </option>
                {viagens.map((viagem) => (
                  <option key={viagem.id} value={viagem.id}>
                    {viagem.descricao} - {viagem.motorista.nome} ({viagem.transportadora.nome})
                  </option>
                ))}
              </select>
              {errors.viagem_id && (
                <p className="text-sm text-red-600">{errors.viagem_id}</p>
              )}
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">
                Valor (R$) *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', e.target.value)}
                className={errors.valor ? 'border-red-500' : ''}
              />
              {errors.valor && (
                <p className="text-sm text-red-600">{errors.valor}</p>
              )}
              <p className="text-sm text-gray-500">
                Use valores negativos para descontos e positivos para comissões/bônus
              </p>
            </div>
          </CardContent>

          <div className="flex justify-end gap-3 p-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {acerto ? 'Atualizar' : 'Criar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}