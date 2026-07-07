import type { Editor } from '@tiptap/react'
import { dataUrlToImageFile } from '@/components/editor/clipboardImages'
import { uploadMedia } from '@/features/media/mediaService'

interface DataUrlImageNode {
  pos: number
  src: string
  alt?: string | null
}

function collectDataUrlImages(editor: Editor): DataUrlImageNode[] {
  const images: DataUrlImageNode[] = []

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'image') return

    const src = node.attrs.src
    if (typeof src !== 'string' || !src.startsWith('data:image/')) return

    images.push({
      pos,
      src,
      alt: typeof node.attrs.alt === 'string' ? node.attrs.alt : null,
    })
  })

  return images
}

export async function replaceDataUrlImagesInEditor(editor: Editor, userId: string): Promise<number> {
  const dataUrlImages = collectDataUrlImages(editor)
  if (dataUrlImages.length === 0) return 0

  let replaced = 0

  for (const image of [...dataUrlImages].sort((a, b) => b.pos - a.pos)) {
    const file = await dataUrlToImageFile(image.src, replaced)
    if (!file) continue

    let publicUrl: string
    let altName: string
    try {
      const asset = await uploadMedia(file, userId, image.alt ?? file.name)
      publicUrl = asset.public_url
      altName = asset.original_name
    } catch (error) {
      console.warn('[paste] Failed to upload embedded image, skipping', error)
      continue
    }

    const node = editor.state.doc.nodeAt(image.pos)
    if (!node || node.type.name !== 'image') continue

    editor
      .chain()
      .command(({ tr }) => {
        tr.setNodeMarkup(image.pos, undefined, {
          ...node.attrs,
          src: publicUrl,
          alt: altName,
        })
        return true
      })
      .run()

    replaced += 1
  }

  return replaced
}
