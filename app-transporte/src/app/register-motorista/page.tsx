'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Transportadora {
  id: string
  nome: string
}

export default function RegisterMotoristaPage() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [cnh, setCnh] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [transportadoraId, setTransportadoraId] = useState('')
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { login } = useUser()

  // Carregar lista de transportadoras
  useEffect(() => {
    const fetchTransportadoras = async () => {
      try {
        const response = await fetch('/api/transportadoras')
        if (response.ok) {
          const data = await response.json()
          setTransportadoras(data)
        }
      } catch (error) {
        console.error('Erro ao carregar transportadoras:', error)
      }
    }
    fetchTransportadoras()
  }, [])

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
      // Validações
      if (!nome || nome.length < 3) {
        throw new Error('Nome deve ter pelo menos 3 caracteres')
      }
      
      const cpfSoNumeros = cpf.replace(/\D/g, '')
      if (cpfSoNumeros.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos')
      }
      
      if (password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres')
      }
      
      if (!email.includes('@')) {
        throw new Error('Email inválido')
      }

      if (!transportadoraId) {
        throw new Error('Selecione uma transportadora')
      }

      // Registrar motorista
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          nome, 
          type: "MOTORISTA",
          cpf: cpfSoNumeros,
          cnh: cnh || undefined,
          telefone: telefone || undefined,
          transportadoraId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao registrar")
      }

      setSuccess(true)
      setError('')
      
      // Fazer login automático após registro
      const loginSuccess = await login(email, password)
      if (loginSuccess) {
        router.push("/dashboard")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro no cadastro"
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
              Preencha os dados para criar sua conta de motorista
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                required
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnh">CNH</Label>
              <Input
                id="cnh"
                type="text"
                value={cnh}
                onChange={(e) => setCnh(e.target.value)}
                placeholder="Número da CNH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(XX) XXXXX-XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportadora">Transportadora *</Label>
              <select
                id="transportadora"
                value={transportadoraId}
                onChange={(e) => setTransportadoraId(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione uma transportadora</option>
                {transportadoras.map((transportadora) => (
                  <option key={transportadora.id} value={transportadora.id}>
                    {transportadora.nome}
                  </option>
                ))}
              </select>
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