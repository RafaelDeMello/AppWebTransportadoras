'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectPath = searchParams.get('redirect') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    console.log('🔵 [LOGIN] Iniciando processo de login...')
    console.log('🔵 [LOGIN] Email:', email)
    console.log('🔵 [LOGIN] Redirect path:', redirectPath)
    
    try {
      console.log('🔵 [LOGIN] Chamando função login do UserContext...')
      const result = await login(email, password)
      console.log('🔵 [LOGIN] Resultado do login:', result)
      
      if (result.success) {
        console.log('✅ [LOGIN] Login bem-sucedido! Redirecionando para:', redirectPath)
        console.log('🔵 [LOGIN] Tentando router.push...')
        router.push(redirectPath)
        
        // Fallback: forçar redirecionamento após um pequeno delay
        console.log('🔵 [LOGIN] Configurando fallback com window.location...')
        setTimeout(() => {
          console.log('🔵 [LOGIN] Executando fallback - window.location.href')
          window.location.href = redirectPath
        }, 200)
      } else {
        console.log('❌ [LOGIN] Falha no login:', result.error)
        setError(result.error || 'Email ou senha inválidos')
      }
    } catch (err: unknown) {
      console.error('💥 [LOGIN] Erro durante o login:', err)
      const message = err instanceof Error ? err.message : 'Falha no login'
      setError(message)
    } finally {
      console.log('🔵 [LOGIN] Finalizando processo de login')
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Button type="button" variant="outline" className="w-full mb-2" onClick={() => router.push('/register')}>
                Criar conta - Transportadora
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
