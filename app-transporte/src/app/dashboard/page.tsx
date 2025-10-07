'use client'

import React, { useState } from 'react'
import { MotoristaForm } from '@/components/forms/MotoristaForm'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'


export default function Dashboard() {
  // ...
  const [motoristaFormOpen, setMotoristaFormOpen] = useState(false)
  const [codigoGerado, setCodigoGerado] = useState<string | null>(null)
  const [transportadoraId, setTransportadoraId] = useState<string>('')

  // Função para cadastrar motorista
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

  async function handleCadastrarMotorista(data: MotoristaFormData) {
    // Garante que o transportadoraId está preenchido corretamente
    const dataComTransportadora = {
      ...data,
      transportadoraId: transportadoraId || data.transportadoraId || '',
    }
    try {
      const res = await fetch('/api/motoristas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataComTransportadora),
      })
      if (res.ok) {
        const motorista = await res.json()
        setCodigoGerado(`Motorista ${motorista.nome} cadastrado com sucesso!`)
        alert('Motorista cadastrado com sucesso!')
      } else {
        const erro = await res.json().catch(() => ({}))
        alert(erro.error || 'Erro ao cadastrar motorista')
        setCodigoGerado('Erro ao cadastrar motorista')
      }
    } catch (err) {
      alert('Erro ao cadastrar motorista')
      setCodigoGerado('Erro ao cadastrar motorista')
    }
    setMotoristaFormOpen(false)
  }

  // Busca o transportadoraId do usuário logado ao abrir o formulário
  React.useEffect(() => {
    if (motoristaFormOpen) {
      fetch('/api/auth/me')
        .then(res => {
          if (!res.ok) {
            alert('Erro ao buscar dados do usuário. Faça login novamente ou verifique seu vínculo com a transportadora.');
            setTransportadoraId('');
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data?.transportadora?.id) {
            setTransportadoraId(data.transportadora.id)
          } else {
            setTransportadoraId('')
            alert('Usuário não está vinculado a uma transportadora. Cadastro de motorista não permitido!');
          }
        })
        .catch(() => {
          setTransportadoraId('');
          alert('Erro ao buscar dados do usuário. Faça login novamente ou verifique seu vínculo com a transportadora.');
        })
    }
  }, [motoristaFormOpen])

  return (
    <Layout>
      <div className="space-y-6">
        {/* ...existing code... */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ...existing code... */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ...existing code... */}
                <Button variant="outline" className="h-auto p-4 flex-col" onClick={() => setMotoristaFormOpen(true)}>
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Cadastrar Motorista</span>
                </Button>
                {/* ...existing code... */}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Formulário de motorista (modal) */}
        {motoristaFormOpen && (
          <MotoristaForm
            isOpen={motoristaFormOpen}
            onClose={() => setMotoristaFormOpen(false)}
            onSubmit={handleCadastrarMotorista}
            transportadoraId={transportadoraId} // Passa apenas o transportadoraId
          />
        )}
        {/* Modal do código gerado */}
        {codigoGerado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
              <h2 className="text-xl font-bold mb-4">Código de Validação do Motorista</h2>
              <p className="text-2xl font-mono text-blue-700 mb-4">{codigoGerado}</p>
              <Button className="w-full" onClick={() => setCodigoGerado(null)}>Fechar</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}