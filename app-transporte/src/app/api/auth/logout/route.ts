import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })

    // Remover cookie de sessão
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expira imediatamente
      path: '/'
    })

    return response
  } catch (e) {
    console.error('POST /api/auth/logout error:', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}