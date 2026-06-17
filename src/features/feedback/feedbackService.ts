import type { CsatScore } from '@/lib/csatColors'
import { getVisitorKey, type FeedbackVote } from '@/lib/visitorKey'
import { supabase } from '@/lib/supabase/client'

export interface PostFeedbackSummary {
  likesCount: number
  dislikesCount: number
  avgCsat: number | null
  csatCount: number
}

export interface SubmitPostFeedbackInput {
  postId: string
  vote?: FeedbackVote | null
  comment?: string | null
  csatScore?: CsatScore | null
}

export interface SubmitPostFeedbackResult extends PostFeedbackSummary {
  userVote: FeedbackVote | null
  userCsat: CsatScore | null
}

export interface AdminPostFeedbackItem {
  id: string
  postId: string
  postTitle: string
  postSlug: string
  vote: FeedbackVote | null
  csatScore: CsatScore | null
  comment: string | null
  createdAt: string
  updatedAt: string
}

function mapFeedbackError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: string }).message)

    if (message.includes('submit_post_feedback') || message.includes('Could not find the function')) {
      return 'Não foi possível enviar o feedback. Verifique se as migrations de feedback foram executadas no Supabase.'
    }
    if (message.includes('POST_NOT_FOUND')) {
      return 'Este artigo não está disponível para avaliação.'
    }
    if (message.includes('INVALID_VOTE')) {
      return 'Avaliação inválida.'
    }
    if (message.includes('INVALID_CSAT')) {
      return 'A nota CSAT deve ser entre 0 e 5.'
    }
    if (message.includes('COMMENT_TOO_LONG')) {
      return 'O comentário pode ter no máximo 1000 caracteres.'
    }

    return message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Não foi possível registrar sua avaliação.'
}

function mapSummaryRow(row: {
  likes_count?: number | null
  dislikes_count?: number | null
  avg_csat?: number | string | null
  csat_count?: number | null
} | null | undefined): PostFeedbackSummary {
  const avgCsatRaw = row?.avg_csat

  return {
    likesCount: row?.likes_count ?? 0,
    dislikesCount: row?.dislikes_count ?? 0,
    avgCsat: avgCsatRaw === null || avgCsatRaw === undefined ? null : Number(avgCsatRaw),
    csatCount: row?.csat_count ?? 0,
  }
}

export async function fetchPostFeedbackSummary(postId: string): Promise<PostFeedbackSummary> {
  const { data, error } = await supabase.rpc('get_post_feedback_summary', {
    p_post_id: postId,
  })

  if (error) throw new Error(mapFeedbackError(error))

  const row = Array.isArray(data) ? data[0] : data
  return mapSummaryRow(row)
}

export async function submitPostFeedback(
  input: SubmitPostFeedbackInput,
): Promise<SubmitPostFeedbackResult> {
  const { data, error } = await supabase.rpc('submit_post_feedback', {
    p_post_id: input.postId,
    p_visitor_key: getVisitorKey(),
    p_vote: input.vote ?? null,
    p_comment: input.comment?.trim() || null,
    p_csat_score: input.csatScore ?? null,
  })

  if (error) throw new Error(mapFeedbackError(error))

  const row = Array.isArray(data) ? data[0] : data
  const summary = mapSummaryRow(row)

  return {
    ...summary,
    userVote: (row?.user_vote as FeedbackVote | null) ?? input.vote ?? null,
    userCsat: (row?.user_csat as CsatScore | null) ?? input.csatScore ?? null,
  }
}

export async function fetchAdminPostFeedback(): Promise<AdminPostFeedbackItem[]> {
  const { data, error } = await supabase
    .from('post_feedback')
    .select('id, post_id, vote, csat_score, comment, created_at, updated_at, posts(title, slug)')
    .order('updated_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((item) => {
    const post = Array.isArray(item.posts) ? item.posts[0] : item.posts

    return {
      id: item.id,
      postId: item.post_id,
      postTitle: post?.title ?? 'Artigo removido',
      postSlug: post?.slug ?? '',
      vote: item.vote as FeedbackVote | null,
      csatScore: item.csat_score as CsatScore | null,
      comment: item.comment,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }
  })
}
