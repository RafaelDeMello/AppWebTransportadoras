'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

interface MotoristaFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MotoristaFormData) => void
  motorista?: MotoristaFormData & { id: string }
  transportadoras: Array<{ id: string; nomeFantasia: string }>
}

export function MotoristaForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  motorista,
  transportadoras 
}: MotoristaFormProps) {
  const [formData, setFormData] = useState<MotoristaFormData>({
    nome: '',
    cpf: '',
    cnh: '',
    telefone: '',
    endereco: '',
    dataNascimento: '',
    transportadoraId: '',
    status: 'ATIVO'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (motorista) {
      setFormData({
        nome: motorista.nome,
        cpf: motorista.cpf,
        cnh: motorista.cnh,
        telefone: motorista.telefone || '',
        endereco: motorista.endereco || '',
        dataNascimento: motorista.dataNascimento || '',
        transportadoraId: motorista.transportadoraId,
        status: motorista.status
      })
    } else {
      setFormData({
        nome: '',
        cpf: '',
        cnh: '',
        telefone: '',
        endereco: '',
        dataNascimento: '',
        transportadoraId: '',
        status: 'ATIVO'
      })
    }
    setErrors({})
  }, [motorista, isOpen])

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const formatCNH = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 11)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      if (numbers.length === 11) {
        return numbers.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4')
      } else if (numbers.length === 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      }
    }
    return value
  }

  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '')
    if (numbers.length !== 11) return false
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) return false
    
    // Validar dígitos verificadores
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (parseInt(numbers[9]) !== digit) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (parseInt(numbers[10]) !== digit) return false
    
    return true
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    if (!formData.cnh.trim()) {
      newErrors.cnh = 'CNH é obrigatória'
    } else if (formData.cnh.replace(/\D/g, '').length !== 11) {
      newErrors.cnh = 'CNH deve ter 11 dígitos'
    }

    if (!formData.transportadoraId) {
      newErrors.transportadoraId = 'Transportadora é obrigatória'
    }

    if (formData.telefone && formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone deve ter pelo menos 10 dígitos'
    }

    if (formData.dataNascimento) {
      const birthDate = new Date(formData.dataNascimento)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      if (age < 18) {
        newErrors.dataNascimento = 'Motorista deve ter pelo menos 18 anos'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof MotoristaFormData, value: string) => {
    let formattedValue = value

    switch (field) {
      case 'cpf':
        formattedValue = formatCPF(value)
        break
      case 'cnh':
        formattedValue = formatCNH(value)
        break
      case 'telefone':
        formattedValue = formatPhone(value)
        break
      case 'nome':
        formattedValue = value.replace(/[0-9]/g, '')
        break
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar motorista:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {motorista ? 'Editar Motorista' : 'Novo Motorista'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Digite o nome completo"
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-red-500 mt-1">{errors.nome}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
                className={errors.cpf ? 'border-red-500' : ''}
              />
              {errors.cpf && (
                <p className="text-sm text-red-500 mt-1">{errors.cpf}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cnh">CNH *</Label>
              <Input
                id="cnh"
                type="text"
                value={formData.cnh}
                onChange={(e) => handleInputChange('cnh', e.target.value)}
                placeholder="12345678900"
                maxLength={11}
                className={errors.cnh ? 'border-red-500' : ''}
              />
              {errors.cnh && (
                <p className="text-sm text-red-500 mt-1">{errors.cnh}</p>
              )}
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="text"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                placeholder="(11) 9 8765-4321"
                maxLength={15}
                className={errors.telefone ? 'border-red-500' : ''}
              />
              {errors.telefone && (
                <p className="text-sm text-red-500 mt-1">{errors.telefone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                className={errors.dataNascimento ? 'border-red-500' : ''}
              />
              {errors.dataNascimento && (
                <p className="text-sm text-red-500 mt-1">{errors.dataNascimento}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="transportadoraId">Transportadora *</Label>
              <select
                id="transportadoraId"
                value={formData.transportadoraId}
                onChange={(e) => handleInputChange('transportadoraId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                  errors.transportadoraId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="" className="text-gray-900 bg-white">Selecione uma transportadora</option>
                {transportadoras.map((transportadora) => (
                  <option key={transportadora.id} value={transportadora.id} className="text-gray-900 bg-white">
                    {transportadora.nomeFantasia}
                  </option>
                ))}
              </select>
              {errors.transportadoraId && (
                <p className="text-sm text-red-500 mt-1">{errors.transportadoraId}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                type="text"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'ATIVO' | 'INATIVO')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="ATIVO" className="text-gray-900 bg-white">Ativo</option>
                <option value="INATIVO" className="text-gray-900 bg-white">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : (motorista ? 'Atualizar' : 'Criar')} Motorista
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}