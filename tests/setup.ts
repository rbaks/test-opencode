import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom lacks the Pointer Capture and ResizeObserver APIs that Radix UI
// primitives (Tooltip) and Recharts (ResponsiveContainer) rely on. These
// no-op polyfills let those components render in the test environment so we
// can assert on their real DOM output (glossary tooltips, donut legends).
window.HTMLElement.prototype.hasPointerCapture = () => false
window.HTMLElement.prototype.setPointerCapture = () => {}
window.HTMLElement.prototype.releasePointerCapture = () => {}
window.HTMLElement.prototype.scrollIntoView = () => {}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

afterEach(() => {
  cleanup()
})
