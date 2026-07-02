import { Node, mergeAttributes } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

export type CalloutType = 'tip' | 'warning' | 'info' | 'success'

export const CALLOUT_ICONS: Record<CalloutType, string> = {
  tip: '💡',
  warning: '⚠️',
  info: 'ℹ️',
  success: '✅',
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      insertCallout: (type?: CalloutType) => ReturnType
    }
  }
}

export const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'tip' as CalloutType,
        parseHTML: (element) => (element.getAttribute('data-callout-type') as CalloutType) ?? 'tip',
        renderHTML: (attributes) => ({ 'data-callout-type': attributes.type }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div.callout' }, { tag: 'div[data-callout-type]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const type = node.attrs.type as CalloutType
    const icon = CALLOUT_ICONS[type] ?? '💡'

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'callout',
        'data-callout-type': type,
        'data-callout-icon': icon,
      }),
      0,
    ]
  },

  addCommands() {
    return {
      insertCallout:
        (type: CalloutType = 'tip') =>
        ({ commands, state }) => {
          const { selection } = state
          const hasSelection = !selection.empty

          if (hasSelection) {
            return commands.wrapIn(this.name, { type })
          }

          return commands.insertContent({
            type: this.name,
            attrs: { type },
            content: [{ type: 'paragraph' }],
          })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (!editor.isActive('callout')) return false

        const { state } = editor
        const { $from } = state.selection

        let calloutDepth = -1
        for (let depth = $from.depth; depth > 0; depth -= 1) {
          if ($from.node(depth).type.name === this.name) {
            calloutDepth = depth
            break
          }
        }

        if (calloutDepth === -1) return false

        const callout = $from.node(calloutDepth)
        const paragraphIndex = $from.index(calloutDepth)
        const paragraph = callout.child(paragraphIndex)
        const isEmpty = paragraph.content.size === 0
        const isLastChild = paragraphIndex === callout.childCount - 1

        if (isEmpty && isLastChild) {
          const calloutPos = $from.before(calloutDepth)
          const afterCallout = $from.after(calloutDepth)

          if (callout.childCount === 1) {
            return editor
              .chain()
              .command(({ tr, dispatch }) => {
                if (!dispatch) return true

                tr.replaceWith(calloutPos, afterCallout, state.schema.nodes.paragraph.create())
                tr.setSelection(TextSelection.near(tr.doc.resolve(calloutPos + 1)))
                return true
              })
              .run()
          }

          const paragraphStart = $from.before(calloutDepth + 1)
          const paragraphEnd = $from.after(calloutDepth + 1)

          return editor
            .chain()
            .command(({ tr, dispatch }) => {
              if (!dispatch) return true

              tr.delete(paragraphStart, paragraphEnd)
              const insertPos = tr.mapping.map(afterCallout)
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
