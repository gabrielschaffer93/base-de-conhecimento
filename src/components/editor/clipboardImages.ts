export function getClipboardImageFiles(clipboardData: DataTransfer): File[] {
  const images: File[] = []
  const seen = new Set<string>()

  const add = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return

    const key = `${file.name}-${file.size}-${file.lastModified}`
    if (seen.has(key)) return

    seen.add(key)
    images.push(file)
  }

  for (const file of Array.from(clipboardData.files)) {
    add(file)
  }

  if (images.length === 0) {
    for (const item of Array.from(clipboardData.items)) {
      if (item.type.startsWith('image/')) {
        add(item.getAsFile())
      }
    }
  }

  return images
}
