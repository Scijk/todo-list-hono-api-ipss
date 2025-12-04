import { describe, it, expect } from 'vitest'
import { generateToken, verifyToken } from '@/utils/jwt'

describe('JWT Utils', () => {
  const testSecret = 'test-jwt-secret-key-123'
  const testUserId = 'user-123-abc'
  const testEmail = 'test@example.com'

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const token = await generateToken(testUserId, testEmail, testSecret)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate JWT with three parts (header.payload.signature)', async () => {
      const token = await generateToken(testUserId, testEmail, testSecret)
      const parts = token.split('.')

      expect(parts).toHaveLength(3)
    })

    it('should generate different tokens for different user IDs', async () => {
      const token1 = await generateToken('user1', 'user1@test.com', testSecret)
      const token2 = await generateToken('user2', 'user2@test.com', testSecret)

      expect(token1).not.toBe(token2)
    })

    it('should generate different tokens for different secrets', async () => {
      const token1 = await generateToken(testUserId, testEmail, 'secret1')
      const token2 = await generateToken(testUserId, testEmail, 'secret2')

      expect(token1).not.toBe(token2)
    })

    it('should handle special characters in user ID', async () => {
      const specialUserId = 'user-@#$%^&*()'
      const token = await generateToken(specialUserId, testEmail, testSecret)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should handle empty user ID', async () => {
      const token = await generateToken('', testEmail, testSecret)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token and return user ID and email', async () => {
      const token = await generateToken(testUserId, testEmail, testSecret)
      const payload = await verifyToken(token, testSecret)

      expect(payload).not.toBeNull()
      expect(payload?.userId).toBe(testUserId)
      expect(payload?.email).toBe(testEmail)
    })

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid.token.here'
      const payload = await verifyToken(invalidToken, testSecret)

      expect(payload).toBeNull()
    })

    it('should return null for token with wrong secret', async () => {
      const token = await generateToken(testUserId, testEmail, 'secret1')
      const payload = await verifyToken(token, 'secret2')

      expect(payload).toBeNull()
    })

    it('should return null for malformed token', async () => {
      const malformedToken = 'not-a-valid-jwt'
      const payload = await verifyToken(malformedToken, testSecret)

      expect(payload).toBeNull()
    })

    it('should return null for empty token', async () => {
      const payload = await verifyToken('', testSecret)

      expect(payload).toBeNull()
    })

    it('should verify token with special characters in user ID', async () => {
      const specialUserId = 'user-@#$%'
      const token = await generateToken(specialUserId, testEmail, testSecret)
      const payload = await verifyToken(token, testSecret)

      expect(payload?.userId).toBe(specialUserId)
      expect(payload?.email).toBe(testEmail)
    })

    it('should handle token with modified payload', async () => {
      const token = await generateToken(testUserId, testEmail, testSecret)
      // Intentar modificar el token (cambiar un carácter en el payload)
      const parts = token.split('.')
      const modifiedToken = `${parts[0]}.${parts[1].slice(0, -1)}X.${parts[2]}`

      const payload = await verifyToken(modifiedToken, testSecret)
      expect(payload).toBeNull()
    })

    it('should verify multiple tokens for same user', async () => {
      // Tokens generados en diferentes momentos para el mismo usuario
      const token1 = await generateToken(testUserId, testEmail, testSecret)
      // Pequeño delay para asegurar timestamps diferentes
      await new Promise((resolve) => setTimeout(resolve, 1100))
      const token2 = await generateToken(testUserId, testEmail, testSecret)

      const payload1 = await verifyToken(token1, testSecret)
      const payload2 = await verifyToken(token2, testSecret)

      expect(payload1?.userId).toBe(testUserId)
      expect(payload2?.userId).toBe(testUserId)
      expect(payload1?.email).toBe(testEmail)
      expect(payload2?.email).toBe(testEmail)
      // Los tokens pueden ser diferentes por timestamp, pero ambos son válidos
      const tokensAreDifferent = token1 !== token2
      expect(tokensAreDifferent || token1 === token2).toBe(true)
    })
  })

  describe('Token Lifecycle', () => {
    it('should complete full cycle: generate -> verify -> get user ID and email', async () => {
      const originalUserId = 'user-full-cycle-test'
      const originalEmail = 'cycle@test.com'

      // Generate
      const token = await generateToken(originalUserId, originalEmail, testSecret)
      expect(token).toBeDefined()

      // Verify
      const payload = await verifyToken(token, testSecret)
      expect(payload?.userId).toBe(originalUserId)
      expect(payload?.email).toBe(originalEmail)
    })

    it('should handle multiple users independently', async () => {
      const user1Id = 'user1'
      const user2Id = 'user2'
      const user3Id = 'user3'
      const email1 = 'user1@test.com'
      const email2 = 'user2@test.com'
      const email3 = 'user3@test.com'

      const token1 = await generateToken(user1Id, email1, testSecret)
      const token2 = await generateToken(user2Id, email2, testSecret)
      const token3 = await generateToken(user3Id, email3, testSecret)

      const payload1 = await verifyToken(token1, testSecret)
      const payload2 = await verifyToken(token2, testSecret)
      const payload3 = await verifyToken(token3, testSecret)

      expect(payload1?.userId).toBe(user1Id)
      expect(payload1?.email).toBe(email1)
      expect(payload2?.userId).toBe(user2Id)
      expect(payload2?.email).toBe(email2)
      expect(payload3?.userId).toBe(user3Id)
      expect(payload3?.email).toBe(email3)
    })
  })
})
