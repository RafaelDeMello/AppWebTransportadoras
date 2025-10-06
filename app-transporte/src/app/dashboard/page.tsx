'use client'

import React from 'react'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Truck, 
  Users, 
  Route,
  Plus,
  Calendar,
  BarChart3
} from 'lucide-react'

// Mock data - posteriormente virá da API
const dashboardData = {
  stats: {
    totalReceitas: 45230.50,
    totalDespesas: 12480.30,
    lucroMes: 32750.20,
    viagensAtivas: 8,
    totalMotoristas: 12,
    viagensFinalizadas: 156
  },
  recentTrips: [
    { id: '1', destino: 'São Paulo → Rio de Janeiro', motorista: 'João Silva', status: 'EM_ANDAMENTO', valor: 2500 },
    { id: '2', destino: 'Belo Horizonte → Salvador', motorista: 'Maria Santos', status: 'FINALIZADA', valor: 3200 },
    { id: '3', destino: 'Curitiba → Florianópolis', motorista: 'Pedro Costa', status: 'PLANEJADA', valor: 1800 },
  ]
}

const StatCard = ({ title, value, icon: Icon, trend, trendValue }: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down'
  trendValue?: string
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      {trend && trendValue && (
        <p className="text-xs text-gray-600 flex items-center mt-1">
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          {trendValue} em relação ao mês anterior
        </p>
      )}
    </CardContent>
  </Card>
)

const getStatusColor = (status: string) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-800'
    case 'FINALIZADA': return 'bg-green-100 text-green-800'
    case 'PLANEJADA': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'Em Andamento'
    case 'FINALIZADA': return 'Finalizada'
    case 'PLANEJADA': return 'Planejada'
    default: return status
  }
}

export default function Dashboard() {
  const { stats, recentTrips } = dashboardData

  return (
    <Layout>
          <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Visão geral da sua transportadora
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="sm" className="sm:size-default">
              <Calendar className="mr-2 h-4 w-4" />
              Relatório Mensal
            </Button>
            <Button size="sm" className="sm:size-default">
              <Plus className="mr-2 h-4 w-4" />
              Nova Viagem
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Receitas do Mês"
            value={`R$ ${stats.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend="up"
            trendValue="+12.5%"
          />
          <StatCard
            title="Despesas do Mês"
            value={`R$ ${stats.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={TrendingDown}
            trend="down"
            trendValue="-3.2%"
          />
          <StatCard
            title="Lucro do Mês"
            value={`R$ ${stats.lucroMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            trend="up"
            trendValue="+18.7%"
          />
        </div>

        {/* Segunda linha de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Viagens Ativas"
            value={stats.viagensAtivas}
            icon={Route}
          />
          <StatCard
            title="Total Motoristas"
            value={stats.totalMotoristas}
            icon={Users}
          />
          <StatCard
            title="Viagens Finalizadas"
            value={stats.viagensFinalizadas}
            icon={Truck}
            trend="up"
            trendValue="+8"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Trips */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Viagens Recentes</CardTitle>
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrips.map((trip) => (
                  <div key={trip.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {trip.destino}
                      </p>
                      <p className="text-sm text-gray-600">
                        {trip.motorista}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {getStatusLabel(trip.status)}
                      </span>
                      <span className="font-medium text-green-600 text-sm">
                        R$ {trip.valor.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto p-4 flex-col">
                  <Route className="h-6 w-6 mb-2" />
                  <span className="text-sm">Nova Viagem</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Cadastrar Motorista</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span className="text-sm">Adicionar Receita</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span className="text-sm">Ver Relatórios</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}