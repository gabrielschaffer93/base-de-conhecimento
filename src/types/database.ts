export const loftTokens = {
  orange: {
    primary: '#FF774A',
    dark: '#D94616',
    salmon: '#FF8674',
    lime: '#FFB381',
  },
  green: {
    primary: '#115644',
    dark: '#25302C',
    flag: '#21A484',
    x: '#98CCC0',
    lime: '#CEE79E',
  },
  support: {
    white: '#FFFFFF',
    gray: '#EBEBEB',
    beige: '#F1E2DE',
  },
} as const

export type UserRole = 'super_admin' | 'editor' | 'viewer'
export type PostStatus = 'draft' | 'published' | 'archived'
export type MediaType = 'image' | 'video' | 'document'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  sort_order: number
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: Record<string, unknown>
  status: PostStatus
  category_id: string | null
  author_id: string
  featured_image_url: string | null
  meta_title: string | null
  meta_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PostWithRelations extends Post {
  author?: Profile | null
  category?: Category | null
  tags?: Tag[]
}

export interface MediaAsset {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  storage_path: string
  public_url: string
  type: MediaType
  uploaded_by: string
  alt_text: string | null
  created_at: string
}

export interface PostFormData {
  title: string
  slug: string
  content: Record<string, unknown>
  status: PostStatus
  category_id: string | null
  tag_ids: string[]
  featured_image_url: string | null
  meta_title: string
  meta_description: string
}

export interface DashboardStats {
  totalPosts: number
  draftPosts: number
  publishedPosts: number
  archivedPosts: number
  activeUsers: number
  totalUsers: number
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Category, 'id'>>
      }
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id'> & { id?: string }
        Update: Partial<Omit<Tag, 'id'>>
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Post, 'id'>>
      }
      post_tags: {
        Row: { post_id: string; tag_id: string }
        Insert: { post_id: string; tag_id: string }
        Update: Partial<{ post_id: string; tag_id: string }>
      }
      media_assets: {
        Row: MediaAsset
        Insert: Omit<MediaAsset, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<MediaAsset, 'id'>>
      }
    }
  }
}
