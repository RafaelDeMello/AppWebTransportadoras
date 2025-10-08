'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterMotoristaPage() {
  const [cpf, setCpf] = useState('')
  const [codigoValidacao, setCodigoValidacao] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11) // Limita a 11 dígitos
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2')
    if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validações cliente
      const cpfSoNumeros = cpf.replace(/\D/g, '')
      if (cpfSoNumeros.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos')
      }
      if (!codigoValidacao || codigoValidacao.length !== 6) {
        throw new Error('Código de validação deve ter 6 caracteres')
      }
      if (password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres')
      }
      if (!email.includes('@')) {
        throw new Error('Email inválido')
      }

      // PASSO 1: Criar conta no Supabase primeiro
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        const msg = signUpError.message?.toLowerCase?.() || ''
        if (msg.includes('already registered') || msg.includes('já registrado')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
          if (signInError) {
            throw new Error(`Erro ao autenticar: ${signInError.message}`)
          }
        } else {
          throw new Error(`Erro ao criar conta: ${signUpError.message}`)
        }
      }

      // PASSO 2: Sincronizar com nossa tabela Usuario
      await fetch('/api/auth/sync', { method: 'POST' })

      // PASSO 3: Agora validar CPF + código (com autenticação ativa)
      const validateRes = await fetch('/api/auth/validate-motorista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: cpfSoNumeros,
          codigoValidacao: codigoValidacao.toUpperCase(),
        }),
      })

      if (!validateRes.ok) {
        const j = await validateRes.json().catch(() => ({}))
        throw new Error(j.error || 'Falha na validação do CPF/código')
      }

      setSuccess(true)
      setError('')
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro no cadastro'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-10">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-4">Registro Concluído!</h2>
              <p className="text-gray-600">Redirecionando para o dashboard...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Registro de Motorista</CardTitle>
            <CardDescription className="text-center">
              Digite seu CPF e o código fornecido pelo administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="!text-white"
                style={{ color: 'white' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="!text-white"
                style={{ color: 'white' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                required
                placeholder="000.000.000-00"
                maxLength={14}
                className="!text-white"
                style={{ color: 'white' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código de Validação</Label>
              <Input
                id="codigo"
                type="text"
                value={codigoValidacao}
                onChange={(e) => setCodigoValidacao(e.target.value.toUpperCase())}
                required
                placeholder="ABC123"
                maxLength={6}
                className="!text-white font-mono"
                style={{ color: 'white' }}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Já tem conta?{' '}
              <a href="/login" className="text-blue-600 hover:underline">
                Fazer login
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </Layout>
  )
}