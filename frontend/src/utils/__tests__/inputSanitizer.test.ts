import { describe, it, expect } from 'vitest'
import { sanitizeInput, validateAddress, validatePositiveNumber } from '../inputSanitizer'

describe('inputSanitizer', () => {
  describe('sanitizeInput', () => {
    it('removes script tags', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello'
      const sanitized = sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
      expect(sanitized).toContain('Hello')
    })

    it('removes javascript: protocols', () => {
      const maliciousInput = 'javascript:alert("xss")'
      const sanitized = sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('alert')
    })

    it('removes on* event handlers', () => {
      const maliciousInput = '<div onclick="alert(1)">Click me</div>'
      const sanitized = sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).not.toContain('alert')
    })

    it('preserves safe content', () => {
      const safeInput = 'Hello World 123 !@#$%'
      const sanitized = sanitizeInput(safeInput)
      
      expect(sanitized).toBe(safeInput)
    })

    it('handles empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })

    it('trims whitespace', () => {
      const input = '  Hello World  '
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).toBe('Hello World')
    })
  })

  describe('validateAddress', () => {
    it('validates correct Ethereum addresses', () => {
      const validAddress = '0x1234567890123456789012345678901234567890'
      expect(validateAddress(validAddress)).toBe(true)
    })

    it('rejects invalid address formats', () => {
      expect(validateAddress('invalid')).toBe(false)
      expect(validateAddress('0x123')).toBe(false) // too short
      expect(validateAddress('1234567890123456789012345678901234567890')).toBe(false) // no 0x prefix
      expect(validateAddress('')).toBe(false)
      expect(validateAddress(null as any)).toBe(false)
    })

    it('rejects addresses with invalid characters', () => {
      const invalidAddress = '0x123456789012345678901234567890123456789G' // G is not hex
      expect(validateAddress(invalidAddress)).toBe(false)
    })

    it('handles mixed case addresses', () => {
      const mixedCaseAddress = '0x1234567890123456789012345678901234567890'
      expect(validateAddress(mixedCaseAddress.toLowerCase())).toBe(true)
      expect(validateAddress(mixedCaseAddress.toUpperCase())).toBe(true)
    })
  })

  describe('validatePositiveNumber', () => {
    it('validates positive numbers', () => {
      expect(validatePositiveNumber('1')).toBe(true)
      expect(validatePositiveNumber('0.1')).toBe(true)
      expect(validatePositiveNumber('100.5')).toBe(true)
      expect(validatePositiveNumber('0.0001')).toBe(true)
    })

    it('rejects zero and negative numbers', () => {
      expect(validatePositiveNumber('0')).toBe(false)
      expect(validatePositiveNumber('-1')).toBe(false)
      expect(validatePositiveNumber('-0.1')).toBe(false)
    })

    it('rejects invalid number formats', () => {
      expect(validatePositiveNumber('abc')).toBe(false)
      expect(validatePositiveNumber('')).toBe(false)
      expect(validatePositiveNumber('1.2.3')).toBe(false)
      expect(validatePositiveNumber('1e10')).toBe(false) // scientific notation
      expect(validatePositiveNumber(null as any)).toBe(false)
      expect(validatePositiveNumber(undefined as any)).toBe(false)
    })

    it('handles edge cases', () => {
      expect(validatePositiveNumber('0.0')).toBe(false)
      expect(validatePositiveNumber('00.1')).toBe(true) // leading zeros ok
      expect(validatePositiveNumber('1.')).toBe(true) // trailing decimal ok
      expect(validatePositiveNumber('.1')).toBe(true) // leading decimal ok
    })

    it('validates within reasonable ranges', () => {
      expect(validatePositiveNumber('999999999')).toBe(true)
      expect(validatePositiveNumber('0.000000001')).toBe(true)
    })
  })
})