import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export type AuthUser = {
	id: string
	email: string
	role: 'ADMIN_TRANSPORTADORA' | 'MOTORISTA'
	transportadoraId?: string
	motoristaId?: string
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
	try {
		const token = request.cookies.get('auth-token')?.value
		if (!token) return null
		const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
		// Mapear nosso token payload para AuthUser
		const user: AuthUser = {
			id: payload.userId,
			email: payload.email,
			role: payload.type === 'TRANSPORTADORA' ? 'ADMIN_TRANSPORTADORA' : 'MOTORISTA',
			transportadoraId: payload.type === 'TRANSPORTADORA' ? payload.userId : undefined,
			motoristaId: payload.type === 'MOTORISTA' ? payload.userId : undefined,
		}
		return user
	} catch {
		return null
	}
}