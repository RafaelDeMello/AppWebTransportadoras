'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Truck, 
  LayoutDashboard, 
  Users, 
  Route, 
  DollarSign, 
  Receipt, 
  Calculator,
  Menu,
  X,
  User,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavigationItem[] = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transportadoras', href: '/transportadoras', icon: Truck },
  { name: 'Motoristas', href: '/motoristas', icon: Users },
  { name: 'Viagens', href: '/viagens', icon: Route },
  { name: 'Receitas', href: '/receitas', icon: DollarSign },
  { name: 'Despesas', href: '/despesas', icon: Receipt },
  { name: 'Acertos', href: '/acertos', icon: Calculator },
]

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string) => {
    router.push(href)
    setSidebarOpen(false)
  }

  const currentPage = navigation.find(item => item.href === pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Top Navigation */}
      <div className="hidden lg:block">
        <nav className="bg-slate-800 shadow-lg fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <Truck className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold text-white">TransApp</span>
              </div>

              {/* Navigation Links */}
              <div className="flex space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </button>
                  )
                })}
              </div>

              {/* User section */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-slate-700 rounded-full p-2">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-sm font-medium text-white">Rafael de Mello</p>
                    <p className="text-xs text-slate-400">Administrador</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline ml-2">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">TransApp</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-slate-700 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-slate-700 rounded-full p-2">
                <User className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Rafael de Mello</p>
                <p className="text-xs text-slate-400">Administrador</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pt-16">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 lg:hidden">
          <div className="bg-white shadow-sm border-b">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Truck className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-gray-900">TransApp</span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {currentPage?.name || 'TransApp'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:py-8">
          <div className="max-w-7xl mx-auto lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}