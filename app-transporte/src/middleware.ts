import { NextResponse } from 'next/server'

export async function middleware() {
  // TODO: Temporariamente desabilitado para desenvolvimento
  // Reaabilitar quando implementarmos as telas de login
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}