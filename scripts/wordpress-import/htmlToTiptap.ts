import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import { generateJSON } from '@tiptap/html'
import { Window } from 'happy-dom'

let domReady = false

function ensureDomEnvironment() {
  if (domReady) return

  const window = new Window()
  Object.defineProperty(globalThis, 'document', {
    value: window.document,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'window', {
    value: window,
    configurable: true,
  })

  domReady = true
}

export function htmlToTiptapContent(html: string): Record<string, unknown> {
  ensureDomEnvironment()

  const cleanedHtml = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .trim()

  const extensions = [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
      },
    }),
    Image,
  ]

  return generateJSON(cleanedHtml, extensions) as Record<string, unknown>
}
