import { Window } from 'happy-dom'

let installed = false

/** Required for TipTap HTML parsing in Node.js import scripts. */
export function ensureDomEnvironment(): void {
  if (installed) return

  if (typeof globalThis.DOMParser !== 'undefined') {
    installed = true
    return
  }

  const window = new Window()

  Object.defineProperty(globalThis, 'document', {
    value: window.document,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'window', {
    value: window,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'DOMParser', {
    value: window.DOMParser,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'Node', {
    value: window.Node,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'Element', {
    value: window.Element,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'HTMLElement', {
    value: window.HTMLElement,
    configurable: true,
  })

  installed = true
}
