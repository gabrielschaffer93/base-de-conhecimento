import { Node, mergeAttributes, type Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    accordion: {
      insertAccordion: (title?: string) => ReturnType
    }
  }
}

function focusAccordionContent(editor: Editor, accordionPos: number) {
  const resolved = editor.state.doc.resolve(Math.min(accordionPos + 1, editor.state.doc.content.size))
  editor.view.dispatch(editor.state.tr.setSelection(TextSelection.near(resolved)))
  editor.view.focus()
}

export const AccordionExtension = Node.create({
  name: 'accordion',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: {
        default: 'Título da seção',
        parseHTML: (element) =>
          element.querySelector('[data-accordion-title]')?.textContent?.trim() ?? 'Título da seção',
        renderHTML: () => ({}),
      },
      open: {
        default: true,
        parseHTML: (element) => {
          if (element.tagName === 'DETAILS') return element.hasAttribute('open')
          return element.getAttribute('data-open') === 'true'
        },
        renderHTML: (attributes) => {
          if (attributes.open) return { 'data-open': 'true', open: 'open' }
          return { 'data-open': 'false' }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'details[data-accordion]' }, { tag: 'div[data-accordion]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        'data-accordion': '',
        class: 'accordion',
        'data-open': node.attrs.open ? 'true' : 'false',
        ...(node.attrs.open ? { open: 'open' } : {}),
      }),
      [
        'summary',
        { class: 'accordion-summary' },
        ['span', { class: 'accordion-toggle', 'aria-hidden': 'true' }],
        ['span', { 'data-accordion-title': '', class: 'accordion-title' }, node.attrs.title],
      ],
      ['div', { class: 'accordion-content' }, 0],
    ]
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div')
      dom.className = 'accordion'
      dom.dataset.accordion = ''

      const header = document.createElement('button')
      header.type = 'button'
      header.className = 'accordion-summary'
      header.contentEditable = 'false'

      const toggle = document.createElement('span')
      toggle.className = 'accordion-toggle'
      toggle.setAttribute('aria-hidden', 'true')

      const titleSpan = document.createElement('span')
      titleSpan.className = 'accordion-title'
      titleSpan.dataset.accordionTitle = ''
      titleSpan.textContent = node.attrs.title

      const content = document.createElement('div')
      content.className = 'accordion-content'

      header.appendChild(toggle)
      header.appendChild(titleSpan)
      dom.appendChild(header)
      dom.appendChild(content)

      const applyOpenState = (isOpen: boolean) => {
        dom.dataset.open = isOpen ? 'true' : 'false'
        header.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
      }

      const persistOpenState = (isOpen: boolean) => {
        const pos = getPos()
        if (typeof pos !== 'number') return

        const currentNode = editor.state.doc.nodeAt(pos)
        if (!currentNode) return

        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(pos, undefined, {
            ...currentNode.attrs,
            open: isOpen,
          }),
        )
      }

      applyOpenState(Boolean(node.attrs.open))

      header.addEventListener('mousedown', (event) => {
        event.preventDefault()
      })

      header.addEventListener('click', (event) => {
        event.preventDefault()

        const nextOpen = dom.dataset.open !== 'true'
        applyOpenState(nextOpen)
        persistOpenState(nextOpen)

        if (nextOpen && editor.isEditable) {
          const pos = getPos()
          if (typeof pos !== 'number') return
          requestAnimationFrame(() => focusAccordionContent(editor, pos))
        }
      })

      return {
        dom,
        contentDOM: content,
        update(updatedNode) {
          if (updatedNode.type.name !== 'accordion') return false

          titleSpan.textContent = updatedNode.attrs.title
          applyOpenState(Boolean(updatedNode.attrs.open))
          return true
        },
        ignoreMutation(mutation) {
          return !content.contains(mutation.target)
        },
        stopEvent(event) {
          if (!(event.target instanceof globalThis.Node)) return false
          return header.contains(event.target)
        },
      }
    }
  },

  addCommands() {
    return {
      insertAccordion:
        (title = 'Título da seção') =>
        ({ chain, state }) => {
          const { from } = state.selection

          return chain()
            .insertContentAt(from, {
              type: this.name,
              attrs: { title, open: true },
              content: [{ type: 'paragraph' }],
            })
            .command(({ tr, dispatch }) => {
              if (!dispatch) return true

              tr.setSelection(TextSelection.near(tr.doc.resolve(from + 1)))
              return true
            })
            .focus()
            .run()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (!editor.isActive('accordion')) return false

        const { state } = editor
        const { $from } = state.selection

        let accordionDepth = -1
        for (let depth = $from.depth; depth > 0; depth -= 1) {
          if ($from.node(depth).type.name === this.name) {
            accordionDepth = depth
            break
          }
        }

        if (accordionDepth === -1) return false

        const accordion = $from.node(accordionDepth)
        const paragraphIndex = $from.index(accordionDepth)
        const paragraph = accordion.child(paragraphIndex)
        const isEmpty = paragraph.content.size === 0
        const isLastChild = paragraphIndex === accordion.childCount - 1

        if (isEmpty && isLastChild) {
          const accordionPos = $from.before(accordionDepth)
          const afterAccordion = $from.after(accordionDepth)

          if (accordion.childCount === 1) {
            return editor
              .chain()
              .command(({ tr, dispatch }) => {
                if (!dispatch) return true

                tr.replaceWith(accordionPos, afterAccordion, state.schema.nodes.paragraph.create())
                tr.setSelection(TextSelection.near(tr.doc.resolve(accordionPos + 1)))
                return true
              })
              .run()
          }

          const paragraphStart = $from.before(accordionDepth + 1)
          const paragraphEnd = $from.after(accordionDepth + 1)

          return editor
            .chain()
            .command(({ tr, dispatch }) => {
              if (!dispatch) return true

              tr.delete(paragraphStart, paragraphEnd)
              const insertPos = tr.mapping.map(afterAccordion)
              tr.insert(insertPos, state.schema.nodes.paragraph.create())
              tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 1)))
              return true
            })
            .run()
        }

        return editor.commands.setHardBreak()
      },
    }
  },
})
