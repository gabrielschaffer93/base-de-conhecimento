import { Node, mergeAttributes } from '@tiptap/core'
import type { VideoEmbedProvider } from '@/lib/videoEmbeds'

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
    return [{ tag: 'div[data-video-embed]' }]
  },

  renderHTML({ node }) {
    const attrs = node.attrs as VideoEmbedAttributes

    return [
      'div',
      {
        'data-video-embed': '',
        'data-provider': attrs.provider,
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
