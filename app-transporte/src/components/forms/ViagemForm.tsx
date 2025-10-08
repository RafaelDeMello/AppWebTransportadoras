"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { X, Save } from 'lucide-react'

export interface ViagemFormData {
  descricao: string
  dataInicio: string
  dataFim?: string
}

interface ViagemFormProps {
  viagem?: Partial<ViagemFormData>
  onSave: (data: ViagemFormData) => Promise<void>
  onCancel: () => void
}

export function ViagemForm({ viagem, onSave, onCancel }: ViagemFormProps) {
  const [formData, setFormData] = useState<ViagemFormData>({
    descricao: viagem?.descricao || '',
    dataInicio: viagem?.dataInicio || '',
    dataFim: viagem?.dataFim || ''
  })
  const [errors, setErrors] = useState<Partial<ViagemFormData>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<ViagemFormData> = {}
    if (!formData.descricao.trim()) newErrors.descricao = 'Descrição é obrigatória'
    if (!formData.dataInicio.trim()) newErrors.dataInicio = 'Data de início é obrigatória'
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
      console.error('Erro ao salvar viagem:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ViagemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{viagem ? 'Editar Viagem' : 'Nova Viagem'}</CardTitle>
            <CardDescription>
              {viagem ? 'Edite as informações da viagem' : 'Cadastre uma nova viagem'}
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
                onChange={e => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Viagem para São Paulo"
                className={`text-white ${errors.descricao ? 'border-red-500' : ''}`}
              />
              {errors.descricao && <p className="text-sm text-red-500 mt-1">{errors.descricao}</p>}
            </div>
            <div>
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={formData.dataInicio}
                onChange={e => handleInputChange('dataInicio', e.target.value)}
                className={`text-white ${errors.dataInicio ? 'border-red-500' : ''}`}
              />
              {errors.dataInicio && <p className="text-sm text-red-500 mt-1">{errors.dataInicio}</p>}
            </div>
            {/* Campo de dataFim removido do cadastro, será definido ao finalizar viagem */}
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
