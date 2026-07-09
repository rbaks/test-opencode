import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'

describe('App smoke test', () => {
  it('renders the app title in the header', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: /Passive Portfolio Visualizer/i }),
    ).toBeInTheDocument()
  })

  it('shows the always-visible disclaimer notice (FR-011)', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByText(/not financial advice/i),
    ).toBeInTheDocument()
  })
})
