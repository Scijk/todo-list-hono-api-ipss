import { SignJWT, jwtVerify } from 'jose'

const getSecretKey = (jwtSecret: string): Uint8Array => {
  return new TextEncoder().encode(jwtSecret)
}

export const generateToken = async (userId: string, email: string, jwtSecret: string): Promise<string> => {
  const secret = getSecretKey(jwtSecret)

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  return token
}

export const verifyToken = async (token: string, jwtSecret: string): Promise<{ userId: string; email: string } | null> => {
  try {
    const secret = getSecretKey(jwtSecret)
    const { payload } = await jwtVerify(token, secret)

    if (!payload.sub || !payload.email) {
      return null
    }

    return {
      userId: payload.sub,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}
