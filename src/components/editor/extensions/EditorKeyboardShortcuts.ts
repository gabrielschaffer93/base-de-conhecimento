import { Extension } from '@tiptap/core'

/**
 * Keyboard shortcuts aligned with WordPress Classic Editor conventions.
 * StarterKit already provides Mod-b, Mod-i, Mod-z, Shift-Mod-z, Mod-y, Enter, etc.
 */
export const EditorKeyboardShortcuts = Extension.create({
  name: 'editorKeyboardShortcuts',

  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleUnderline(),
      'Mod-Shift-x': () => this.editor.commands.toggleStrike(),
    }
  },
})
