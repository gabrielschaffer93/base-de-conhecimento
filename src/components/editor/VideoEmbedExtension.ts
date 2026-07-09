import { Node, mergeAttributes } from '@tiptap/core'
import { parseVideoEmbedUrl, type VideoEmbedProvider } from '@/lib/videoEmbeds'

export interface VideoEmbedAttributes {
  src: string
  href: string
  provider: VideoEmbedProvider
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoEmbed: {
      insertVideoEmbed: (attrs: VideoEmbedAttributes) => ReturnType
    }
  }
}

const VIDEO_EMBED_CLASS = 'video-embed'
const VIDEO_PLAYER_CLASS = 'video-embed-player'
const VIDEO_LINK_CLASS = 'video-embed-link'

function buildPlayerNode(attrs: VideoEmbedAttributes) {
  if (attrs.provider === 'html5') {
    return [
      'video',
      {
        src: attrs.src,
        controls: 'true',
        playsinline: 'true',
        preload: 'metadata',
      },
    ] as const
  }

  return [
    'iframe',
    mergeAttributes({
      src: attrs.src,
      allowfullscreen: 'true',
      allow:
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      referrerpolicy: 'strict-origin-when-cross-origin',
      title: 'Vídeo incorporado',
    }),
  ] as const
}

export const VideoEmbedExtension = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      href: { default: null },
      provider: { default: 'youtube' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video-embed]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false

          const iframeSrc = element.querySelector('iframe')?.getAttribute('src') ?? ''
          const videoSrc = element.querySelector('video')?.getAttribute('src') ?? ''
          const linkHref =
            element.querySelector('.video-embed-link')?.getAttribute('href') ??
            element.querySelector('a[href]')?.getAttribute('href') ??
            ''

          const rawSrc =
            element.getAttribute('data-src') ?? iframeSrc ?? videoSrc ?? linkHref
          const rawHref = element.getAttribute('data-href') ?? linkHref ?? rawSrc

          const parsed = parseVideoEmbedUrl(rawHref) ?? parseVideoEmbedUrl(rawSrc)
          if (!parsed && !rawSrc) return false

          return {
            src: parsed?.embedSrc ?? rawSrc,
            href: parsed?.href ?? rawHref,
            provider: (element.getAttribute('data-provider') ??
              parsed?.provider ??
              'youtube') as VideoEmbedProvider,
          }
        },
      },
      {
        tag: 'iframe[src]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false
          const src = element.getAttribute('src') ?? ''
          const parsed = parseVideoEmbedUrl(src)
          if (!parsed) return false
          return {
            src: parsed.embedSrc,
            href: parsed.href,
            provider: parsed.provider,
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    const attrs = node.attrs as VideoEmbedAttributes

    return [
      'div',
      {
        'data-video-embed': '',
        'data-provider': attrs.provider,
        'data-src': attrs.src,
        'data-href': attrs.href,
        class: VIDEO_EMBED_CLASS,
      },
      ['div', { class: VIDEO_PLAYER_CLASS }, buildPlayerNode(attrs)],
      [
        'a',
        {
          class: VIDEO_LINK_CLASS,
          href: attrs.href,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        attrs.href,
      ],
    ]
  },

  addCommands() {
    return {
      insertVideoEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})
