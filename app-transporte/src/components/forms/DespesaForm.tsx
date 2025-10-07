'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save } from 'lucide-react'

export interface DespesaFormData {
  descricao: string
  valor: string
  viagem_id: string
}

type MinimalDespesa = {
  descricao?: string
  valor?: number
  viagem_id?: string
  viagemId?: string
} | null

interface DespesaFormProps {
  despesa?: MinimalDespesa
  onSave: (data: DespesaFormData) => Promise<void>
  onCancel: () => void
}

export function DespesaForm({ despesa, onSave, onCancel }: DespesaFormProps) {
  const [formData, setFormData] = useState<DespesaFormData>({
    descricao: despesa?.descricao || '',
    valor: despesa?.valor != null ? String(despesa.valor) : '',
    viagem_id: (despesa?.viagem_id || despesa?.viagemId || '') as string
  })

  const [errors, setErrors] = useState<Partial<DespesaFormData>>({})
  const [loading, setLoading] = useState(false)
  const [viagens, setViagens] = useState<Array<{ id: string; descricao: string }>>([])
  const [isLoadingViagens, setIsLoadingViagens] = useState(false)

  useEffect(() => {
    const fetchViagens = async () => {
      setIsLoadingViagens(true)
      try {
        const response = await fetch('/api/viagens')
        if (!response.ok) throw new Error('Erro ao carregar viagens')
        const data = await response.json()
        setViagens(
          (data as Array<{ id: string; descricao?: string }>).map((v) => ({ id: v.id, descricao: v.descricao || 'Sem descrição' }))
        )
      } catch (error) {
        console.error('Erro ao buscar viagens:', error)
      } finally {
        setIsLoadingViagens(false)
      }
    }
    fetchViagens()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Partial<DespesaFormData> = {}
    if (!formData.descricao.trim()) newErrors.descricao = 'Descrição é obrigatória'
    const valor = parseFloat(formData.valor.replace(',', '.'))
    if (!formData.valor.trim() || isNaN(valor) || valor <= 0) newErrors.valor = 'Valor deve ser um número positivo'
    if (!formData.viagem_id) newErrors.viagem_id = 'Selecione uma viagem'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
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
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
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
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Manutenção"
                className={errors.descricao ? 'border-red-500' : ''}
              />
              {errors.descricao && <p className="text-sm text-red-500 mt-1">{errors.descricao}</p>}
            </div>

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
                {errors.valor && <p className="text-sm text-red-500 mt-1">{errors.valor}</p>}
              </div>

              <div>
                <Label htmlFor="viagem_id">Viagem *</Label>
                <select
                  id="viagem_id"
                  value={formData.viagem_id}
                  onChange={(e) => handleInputChange('viagem_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${errors.viagem_id ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={isLoadingViagens}
                >
                  <option value="">Selecione uma viagem</option>
                  {isLoadingViagens ? (
                    <option value="" disabled>Carregando viagens...</option>
                  ) : (
                    viagens.map(v => (
                      <option key={v.id} value={v.id}>{v.descricao}</option>
                    ))
                  )}
                </select>
                {errors.viagem_id && <p className="text-sm text-red-500 mt-1">{errors.viagem_id}</p>}
              </div>
            </div>
          </CardContent>

          <div className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
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