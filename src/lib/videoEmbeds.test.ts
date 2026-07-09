import { describe, expect, it } from 'vitest'
import { transformVideoLinksInContent } from '@/lib/videoEmbeds'

const YOUTUBE_URL = 'https://www.youtube.com/watch?v=m5jXLTANOYU'

describe('transformVideoLinksInContent', () => {
  it('keeps custom anchor text linked to a video URL', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Lorem',
              marks: [{ type: 'link', attrs: { href: YOUTUBE_URL } }],
            },
          ],
        },
      ],
    }

    const result = transformVideoLinksInContent(doc)
    expect(result).toEqual(doc)
  })

  it('embeds a bare pasted video URL in a paragraph', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: YOUTUBE_URL }],
        },
      ],
    }

    const result = transformVideoLinksInContent(doc)
    const content = (result.content as { type: string }[]) ?? []

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('videoEmbed')
  })

  it('embeds when visible link text matches the video URL', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: YOUTUBE_URL,
              marks: [{ type: 'link', attrs: { href: YOUTUBE_URL } }],
            },
          ],
        },
      ],
    }

    const result = transformVideoLinksInContent(doc)
    const content = (result.content as { type: string }[]) ?? []

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('videoEmbed')
  })
})
