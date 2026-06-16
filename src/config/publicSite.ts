export interface PublicHeaderCategory {
  label: string
  slugCandidates: string[]
}

export const PUBLIC_HEADER_CATEGORIES: PublicHeaderCategory[] = [
  { label: 'CRM', slugCandidates: ['crm', 'vista-crm'] },
  { label: 'SITES', slugCandidates: ['sites', 'vista-sites'] },
  { label: 'ADM.IMOVEIS', slugCandidates: ['adm-imoveis'] },
  { label: 'PORTAIS', slugCandidates: ['portais'] },
]

export const HERO_VISUAL_PATH = '/hero-visual.png'

export const POST_PLACEHOLDER_IMAGE_PATH = '/SVG.webp'

export const PUBLIC_WHATSAPP_NUMBER = '1140202208'
export const PUBLIC_WHATSAPP_URL = `https://wa.me/${PUBLIC_WHATSAPP_NUMBER}`
