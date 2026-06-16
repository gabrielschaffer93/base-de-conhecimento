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

export const PUBLIC_FOOTER_ADDRESS =
  'Rua Tabapuã, 743 - Itaim Bibi, São Paulo - SP, 04533-012'

export const PUBLIC_FOOTER_DESCRIPTION =
  'A Loft é especialista em soluções para imobiliárias, impulsionando o setor em todo o Brasil com soluções comerciais, tecnológicas e financeiras através da Loft Mais Negócio.'

export const PUBLIC_GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=br.com.loft'

export const PUBLIC_APP_STORE_URL =
  'https://apps.apple.com/br/app/loft-im%C3%B3veis/id1582516551'

export const PUBLIC_SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/loft_br/',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/loftbr',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/loftbr',
  },
] as const

export const PUBLIC_FIANCA_NEGOTIATION_URL =
  'https://app.loft.com.br/fianca-aluguel/inquilino/area-logada/'

export const PUBLIC_SUPPORT_PHONE = '+55 11 4020-2208'
export const PUBLIC_SUPPORT_PHONE_HREF = 'tel:+551140202208'
export const PUBLIC_NEGOTIATION_PHONE = '0800 0016003'
export const PUBLIC_NEGOTIATION_PHONE_HREF = 'tel:08000016003'

export const PUBLIC_FOOTER_EMAILS = [
  {
    address: 'atendimento.fianca@loft.com.br',
    description: 'Assuntos relacionados a Fiança Aluguel',
  },
  {
    address: 'relacionamento.plataforma@loft.com.br',
    description: 'Assuntos relacionados ao CRM Loft',
  },
  {
    address: 'imprensa@loft.com.br',
    description: 'Atendimento exclusivo aos profissionais de imprensa.',
  },
] as const

export const PUBLIC_BUSINESS_HOURS = 'Segunda-feira a sexta-feira das 9:00 às 18:00'
