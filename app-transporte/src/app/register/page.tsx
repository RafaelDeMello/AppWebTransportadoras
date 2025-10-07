'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tipo, setTipo] = useState<'ADMIN' | 'MOTORISTA'>('ADMIN')
  // Campos Admin
  const [transportadoraNome, setTransportadoraNome] = useState('')
  const [transportadoraCnpj, setTransportadoraCnpj] = useState('')
  // Campos Motorista
  const [transportadoraId, setTransportadoraId] = useState('')
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [cnh, setCnh] = useState('')
  const [telefone, setTelefone] = useState('')
  const [transportadoras, setTransportadoras] = useState<Array<{ id: string; nome: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onlyDigits = (v: string) => v.replace(/\D/g, '')
  const formatCPF = (v: string) => {
    const d = onlyDigits(v).slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 6) return d.replace(/(\d{3})(\d+)/, '$1.$2')
    if (d.length <= 9) return d.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
  }
  const formatCNPJ = (v: string) => {
    const d = onlyDigits(v).slice(0, 14)
    if (d.length <= 2) return d
    if (d.length <= 5) return d.replace(/(\d{2})(\d+)/, '$1.$2')
    if (d.length <= 8) return d.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3')
    if (d.length <= 12) return d.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4')
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5')
  }
  const formatTelefone = (v: string) => {
    const d = onlyDigits(v).slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 6) return d.replace(/(\d{2})(\d+)/, '($1) $2')
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3')
    return d.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4')
  }

  const formatCNH = (v: string) => onlyDigits(v).slice(0, 11)

  useEffect(() => {
    const loadTransportadoras = async () => {
      try {
          const res = await fetch('/api/transportadoras')
          if (res.ok) {
            const data = await res.json()
            console.log('Transportadoras recebidas:', data)
            // Garante que só pega id e nome, mesmo se vierem outros campos
            setTransportadoras(
              Array.isArray(data)
                ? data.map((t) => ({ id: t.id, nome: t.nome }))
                : []
            )
          }
      } catch {}
    }
    if (tipo === 'MOTORISTA') loadTransportadoras()
  }, [tipo])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Validações cliente
      if (tipo === 'ADMIN') {
        if (onlyDigits(transportadoraCnpj).length !== 14) {
          throw new Error('CNPJ inválido (14 dígitos)')
        }
      } else {
        if (onlyDigits(cpf).length !== 11) throw new Error('CPF inválido (11 dígitos)')
        if (onlyDigits(cnh).length !== 11) throw new Error('CNH inválida (11 dígitos)')
        if (!transportadoraId) throw new Error('Selecione a transportadora')
        if (onlyDigits(telefone).length < 10) throw new Error('Telefone inválido')
      }
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError

      // Garantir sessão antes de chamar a API protegida
      let { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          // Se confirmação de e-mail for obrigatória, o login é bloqueado até confirmar
          const msg = signInError.message?.toLowerCase?.() || ''
          if (msg.includes('confirm') || msg.includes('email') || msg.includes('verify')) {
            throw new Error('Conta criada. Verifique seu e-mail para confirmar a conta e depois faça login para concluir o cadastro.')
          }
          throw new Error(`Erro ao autenticar após cadastro: ${signInError.message}`)
        }
        // Recarrega o usuário
        const r = await supabase.auth.getUser()
        user = r.data.user
      }

      // Sincronizar com nossa tabela Usuario
      await fetch('/api/auth/sync', { method: 'POST' })
      // Fluxos adicionais
      if (tipo === 'ADMIN') {
        const r = await fetch('/api/auth/register-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transportadoraNome, transportadoraCnpj: onlyDigits(transportadoraCnpj) }),
        })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j.error || 'Falha ao criar transportadora')
        }
      } else {
        const r = await fetch('/api/auth/register-motorista', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transportadoraId,
            nome,
            cpf: onlyDigits(cpf),
            cnh: onlyDigits(cnh),
            telefone: onlyDigits(telefone),
          }),
        })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j.error || 'Falha ao registrar motorista')
        }
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha no cadastro'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Criar Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="tipo">Você é</Label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'ADMIN' | 'MOTORISTA')}
                  className="w-full px-3 py-2 border rounded-md text-black bg-white"
                >
                  <option value="ADMIN">Admin (Transportadora)</option>
                  <option value="MOTORISTA">Motorista</option>
                </select>
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {tipo === 'ADMIN' ? (
                <>
                  <div>
                    <Label htmlFor="transportadoraNome">Nome da Transportadora</Label>
                    <Input id="transportadoraNome" value={transportadoraNome} onChange={(e) => setTransportadoraNome(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="transportadoraCnpj">CNPJ</Label>
                    <Input
                      id="transportadoraCnpj"
                      value={transportadoraCnpj}
                      onChange={(e) => setTransportadoraCnpj(formatCNPJ(e.target.value))}
                      maxLength={18}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="transportadoraId">Transportadora</Label>
                    <select
                      id="transportadoraId"
                      value={transportadoraId}
                      onChange={(e) => setTransportadoraId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-black bg-white"
                      required
                    >
                      <option value="">Selecione...</option>
                      {transportadoras.map((t) => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      maxLength={14}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnh">CNH</Label>
                    <Input
                      id="cnh"
                      value={cnh}
                      onChange={(e) => setCnh(formatCNH(e.target.value))}
                      maxLength={11}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={telefone}
                      onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                      maxLength={16}
                      required
                    />
                  </div>
                </>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando...' : 'Criar conta'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => router.push('/login')}>
                Já tenho conta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
