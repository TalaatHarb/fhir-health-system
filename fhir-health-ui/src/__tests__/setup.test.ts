import { describe, it, expect } from 'vitest'

describe('Test Setup', () => {
  it('should have vitest working correctly', () => {
    expect(true).toBe(true)
  })

  it('should have access to DOM testing utilities', () => {
    const div = document.createElement('div')
    div.textContent = 'Hello World'
    expect(div.textContent).toBe('Hello World')
  })

  it('should have mocked window.matchMedia', () => {
    expect(window.matchMedia).toBeDefined()
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    expect(mediaQuery.matches).toBe(false)
  })
})