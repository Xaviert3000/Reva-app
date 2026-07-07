// Rove Rewards sobre Supabase (Fase 7). Reemplaza el almacén en memoria de
// rove-rewards.ts. Server-only: usa el admin client (service role); las rutas
// /api/rove/* validan la sesión del usuario antes de llamar aquí.
import { createAdminClient } from './supabase/admin'
import type {
  RoveTicket, TicketReason, RoveReward, RoveRedemption,
} from './rove-rewards'

type Admin = ReturnType<typeof createAdminClient>

// ── Mapeos DB → tipos de la app ────────────────────────────
interface RewardRow {
  id: string; biz_id: string | null; biz_name: string | null; biz_letter: string | null; biz_color: string | null
  title: string; description: string | null; cost: number; category: string | null
  stock: number | null; valid_days: number | null; status: string; reject_reason: string | null; created_at: string
}
function mapReward(r: RewardRow): RoveReward {
  return {
    id: r.id, bizId: r.biz_id ?? 'reva', bizName: r.biz_name ?? 'Reva', bizLetter: r.biz_letter ?? 'R', bizColor: r.biz_color ?? '#E8505B',
    title: r.title, description: r.description ?? '', ticketCost: r.cost, category: (r.category as RoveReward['category']) ?? 'discount',
    stock: r.stock, validDays: r.valid_days ?? 30, status: (r.status as RoveReward['status']),
    rejectionReason: r.reject_reason ?? undefined, createdAt: r.created_at,
  }
}
interface TicketRow { id: string; user_id: string; delta: number; reason: string | null; ref_id: string | null; created_at: string }
function mapTicket(t: TicketRow): RoveTicket {
  return { id: t.id, userId: t.user_id, amount: t.delta, reason: (t.reason as TicketReason) ?? 'reservation', referenceId: t.ref_id ?? undefined, createdAt: t.created_at }
}
interface RedemptionRow {
  id: string; user_id: string; reward_id: string | null; biz_id: string | null; code: string; status: string
  cost: number | null; created_at: string; expires_at: string | null; used_at: string | null
  rove_rewards?: RewardRow | null
}
function mapRedemption(r: RedemptionRow, reward?: RoveReward): RoveRedemption {
  const rw = reward ?? (r.rove_rewards ? mapReward(r.rove_rewards) : undefined)
  return {
    id: r.id, userId: r.user_id, rewardId: r.reward_id ?? '', reward: rw as RoveReward,
    ticketsSpent: r.cost ?? 0, code: r.code, status: (r.status as RoveRedemption['status']),
    expiresAt: r.expires_at ?? new Date().toISOString(), usedAt: r.used_at ?? undefined, createdAt: r.created_at,
  }
}

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

// ── Balance ────────────────────────────────────────────────
export async function getBalance(userId: string): Promise<number> {
  const admin = createAdminClient()
  const { data } = await admin.from('rove_tickets').select('delta').eq('user_id', userId)
  return (data ?? []).reduce((s, t) => s + Number(t.delta ?? 0), 0)
}

export async function getTicketHistory(userId: string): Promise<RoveTicket[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('rove_tickets').select('id,user_id,delta,reason,ref_id,created_at').eq('user_id', userId).order('created_at', { ascending: false })
  return (data ?? []).map(t => mapTicket(t as TicketRow))
}

export async function issueTickets(userId: string, amount: number, reason: TicketReason, refId?: string, admin?: Admin): Promise<void> {
  const a = admin ?? createAdminClient()
  await a.from('rove_tickets').insert({ user_id: userId, delta: amount, reason, ref_id: refId ?? null })
}

// ── Catálogo ───────────────────────────────────────────────
const REWARD_COLS = 'id,biz_id,biz_name,biz_letter,biz_color,title,description,cost,category,stock,valid_days,status,reject_reason,created_at'

export async function getActiveRewards(): Promise<RoveReward[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('rove_rewards').select(REWARD_COLS).eq('status', 'active').order('created_at', { ascending: false })
  return (data ?? []).map(r => mapReward(r as RewardRow))
}

export async function getAllRewards(): Promise<RoveReward[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('rove_rewards').select(REWARD_COLS).order('created_at', { ascending: false })
  return (data ?? []).map(r => mapReward(r as RewardRow))
}

export async function proposeReward(
  bizId: string, bizName: string, bizLetter: string, bizColor: string,
  data: Pick<RoveReward, 'title' | 'description' | 'ticketCost' | 'category' | 'stock' | 'validDays'>,
): Promise<RoveReward | null> {
  const admin = createAdminClient()
  const { data: row, error } = await admin.from('rove_rewards').insert({
    biz_id: bizId, biz_name: bizName, biz_letter: bizLetter, biz_color: bizColor,
    title: data.title, description: data.description, cost: data.ticketCost, category: data.category,
    stock: data.stock, valid_days: data.validDays, status: 'pending',
  }).select(REWARD_COLS).single()
  if (error || !row) return null
  return mapReward(row as RewardRow)
}

export async function reviewReward(rewardId: string, decision: 'active' | 'rejected' | 'paused', ticketCost?: number, rejectionReason?: string): Promise<RoveReward | null> {
  const admin = createAdminClient()
  const patch: Record<string, unknown> = { status: decision }
  if (ticketCost !== undefined) patch.cost = ticketCost
  if (rejectionReason) patch.reject_reason = rejectionReason
  const { data, error } = await admin.from('rove_rewards').update(patch).eq('id', rewardId).select(REWARD_COLS).single()
  if (error || !data) return null
  return mapReward(data as RewardRow)
}

// ── Canje ──────────────────────────────────────────────────
export type RedeemResult =
  | { ok: true; redemption: RoveRedemption }
  | { ok: false; error: 'insufficient_tickets' | 'reward_not_found' | 'out_of_stock' }

export async function redeemReward(userId: string, rewardId: string): Promise<RedeemResult> {
  const admin = createAdminClient()
  const { data: row } = await admin.from('rove_rewards').select(REWARD_COLS).eq('id', rewardId).eq('status', 'active').maybeSingle()
  if (!row) return { ok: false, error: 'reward_not_found' }
  const reward = mapReward(row as RewardRow)

  if (reward.stock !== null && reward.stock <= 0) return { ok: false, error: 'out_of_stock' }
  const balance = await getBalance(userId)
  if (balance < reward.ticketCost) return { ok: false, error: 'insufficient_tickets' }

  // Descuenta boletos y crea el canje.
  await issueTickets(userId, -reward.ticketCost, 'redemption', rewardId, admin)
  if (reward.stock !== null) {
    await admin.from('rove_rewards').update({ stock: reward.stock - 1 }).eq('id', rewardId)
  }
  const expiresAt = new Date(Date.now() + reward.validDays * 86400000).toISOString()
  const { data: red } = await admin.from('rove_redemptions').insert({
    user_id: userId, reward_id: rewardId, biz_id: reward.bizId, code: genCode(), status: 'pending', cost: reward.ticketCost, expires_at: expiresAt,
  }).select('id,user_id,reward_id,biz_id,code,status,cost,created_at,expires_at,used_at').single()

  return { ok: true, redemption: mapRedemption(red as RedemptionRow, reward) }
}

export async function getUserRedemptions(userId: string): Promise<RoveRedemption[]> {
  const admin = createAdminClient()
  // Auto-expira los pendientes vencidos.
  await admin.from('rove_redemptions').update({ status: 'expired' }).eq('user_id', userId).eq('status', 'pending').lt('expires_at', new Date().toISOString())
  const { data } = await admin
    .from('rove_redemptions')
    .select('id,user_id,reward_id,biz_id,code,status,cost,created_at,expires_at,used_at, rove_rewards(' + REWARD_COLS + ')')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => mapRedemption(r as unknown as RedemptionRow))
}

// ── Validación en negocio ──────────────────────────────────
export type ValidateResult =
  | { ok: true; redemption: RoveRedemption }
  | { ok: false; error: 'not_found' | 'already_used' | 'expired' }

export async function validateRedemptionCode(code: string, _bizId: string): Promise<ValidateResult> {
  const admin = createAdminClient()
  const { data: row } = await admin
    .from('rove_redemptions')
    .select('id,user_id,reward_id,biz_id,code,status,cost,created_at,expires_at,used_at, rove_rewards(' + REWARD_COLS + ')')
    .eq('code', code.toUpperCase())
    .maybeSingle()
  if (!row) return { ok: false, error: 'not_found' }
  const r = row as unknown as RedemptionRow
  if (r.status === 'used') return { ok: false, error: 'already_used' }
  if (r.status === 'expired' || (r.expires_at && r.expires_at < new Date().toISOString())) return { ok: false, error: 'expired' }
  const { data: used } = await admin.from('rove_redemptions').update({ status: 'used', used_at: new Date().toISOString() }).eq('id', r.id)
    .select('id,user_id,reward_id,biz_id,code,status,cost,created_at,expires_at,used_at, rove_rewards(' + REWARD_COLS + ')').single()
  return { ok: true, redemption: mapRedemption(used as unknown as RedemptionRow) }
}

// ── Referidos ──────────────────────────────────────────────
async function ensureReferralCode(userId: string): Promise<string> {
  const admin = createAdminClient()
  const { data: prof } = await admin.from('profiles').select('referral_code').eq('id', userId).maybeSingle()
  if (prof?.referral_code) return prof.referral_code as string
  const code = genCode()
  await admin.from('profiles').update({ referral_code: code }).eq('id', userId)
  return code
}

export async function getReferralStats(userId: string) {
  const admin = createAdminClient()
  const code = await ensureReferralCode(userId)
  const { data: sent } = await admin.from('rove_referrals').select('status').eq('referrer_id', userId)
  const rows = sent ?? []
  return {
    code,
    totalReferred: rows.length,
    completed: rows.filter(r => r.status === 'completed').length,
    pending: rows.filter(r => r.status === 'pending').length,
  }
}

export type ApplyReferralResult =
  | { ok: true }
  | { ok: false; error: 'code_not_found' | 'self_referral' | 'already_used' }

export async function applyReferralCode(code: string, newUserId: string): Promise<ApplyReferralResult> {
  const admin = createAdminClient()
  const { data: ref } = await admin.from('profiles').select('id').eq('referral_code', code.toUpperCase()).maybeSingle()
  if (!ref) return { ok: false, error: 'code_not_found' }
  if (ref.id === newUserId) return { ok: false, error: 'self_referral' }
  const { data: existing } = await admin.from('rove_referrals').select('id').eq('referred_id', newUserId).maybeSingle()
  if (existing) return { ok: false, error: 'already_used' }
  await admin.from('rove_referrals').insert({ referrer_id: ref.id, referred_id: newUserId, code: code.toUpperCase(), status: 'pending' })
  return { ok: true }
}

export async function completeReferral(referredUserId: string): Promise<{ credited: boolean; referrerId?: string }> {
  const admin = createAdminClient()
  const { data: ref } = await admin.from('rove_referrals').select('id,referrer_id').eq('referred_id', referredUserId).eq('status', 'pending').maybeSingle()
  if (!ref) return { credited: false }
  await admin.from('rove_referrals').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', ref.id)
  await issueTickets(ref.referrer_id as string, 5, 'referral', referredUserId, admin)
  return { credited: true, referrerId: ref.referrer_id as string }
}
