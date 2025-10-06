'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Save, Building2 } from 'lucide-react'

interface TransportadoraFormData {
  nome: string
  cnpj: string
  email?: string
  telefone?: string
  endereco?: string
}

interface TransportadoraFormProps {
  transportadora?: TransportadoraFormData & { id: string }
  onSave: (data: TransportadoraFormData) => Promise<void>
  onCancel: () => void
  isOpen: boolean
}

export function TransportadoraForm({ 
  transportadora, 
  onSave, 
  onCancel, 
  isOpen 
}: TransportadoraFormProps) {
  const [formData, setFormData] = useState<TransportadoraFormData>({
    nome: transportadora?.nome || '',
    cnpj: transportadora?.cnpj || '',
    email: transportadora?.email || '',
    telefone: transportadora?.telefone || '',
    endereco: transportadora?.endereco || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<TransportadoraFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<TransportadoraFormData> = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório'
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter um formato válido'
    }

    if (formData.telefone && !/^\(\d{2}\)\s\d{1}\s\d{4}-\d{4}$/.test(formData.telefone)) {
      newErrors.telefone = 'Telefone deve estar no formato (XX) 9 XXXX-XXXX'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Erro ao salvar transportadora:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof TransportadoraFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return value
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4')
    }
    return value
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle>
                    {transportadora ? 'Editar Transportadora' : 'Nova Transportadora'}
                  </CardTitle>
                  <CardDescription>
                    Preencha os dados da transportadora abaixo
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Transportadora *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Transportes São Paulo Ltda"
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && (
                  <p className="text-sm text-red-600">{errors.nome}</p>
                )}
              </div>

              {/* CNPJ */}
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                  placeholder="XX.XXX.XXX/XXXX-XX"
                  maxLength={18}
                  className={errors.cnpj ? 'border-red-500' : ''}
                />
                {errors.cnpj && (
                  <p className="text-sm text-red-600">{errors.cnpj}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                  placeholder="(XX) 9 XXXX-XXXX"
                  maxLength={16}
                  className={errors.telefone ? 'border-red-500' : ''}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-600">{errors.telefone}</p>
                )}
              </div>

              {/* Endereço */}
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, número, bairro - Cidade/UF"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="order-1 sm:order-2 flex-1"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {transportadora ? 'Atualizar' : 'Criar'} Transportadora
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}