// Rove Rewards — marketplace de recompensas propio de Reva.
// Independiente de BoomerangMe (que maneja stamps/puntos por negocio).
//
// En demo: datos en memoria. En producción: reemplazar las funciones
// con llamadas a Supabase (tablas rove_tickets, rove_rewards, rove_redemptions).

export type TicketReason = 'reservation' | 'review' | 'referral' | 'weekly_bonus' | 'redemption'

export interface RoveTicket {
  id: string
  userId: string
  amount: number          // positivo = ganado, negativo = gastado
  reason: TicketReason
  referenceId?: string    // bookingId, reviewId, redemptionId…
  createdAt: string       // ISO
}

export type RewardCategory = 'food' | 'experience' | 'discount' | 'upgrade'
export type RewardStatus = 'pending' | 'active' | 'paused' | 'rejected'

export interface RoveReward {
  id: string
  bizId: string
  bizName: string
  bizLetter: string       // inicial para el avatar
  bizColor: string        // color de fondo del avatar
  title: string
  description: string
  ticketCost: number
  category: RewardCategory
  stock: number | null    // null = ilimitado
  validDays: number       // días para usar tras canjear
  status: RewardStatus
  rejectionReason?: string
  createdAt: string
}

export type RedemptionStatus = 'pending' | 'used' | 'expired'

export interface RoveRedemption {
  id: string
  userId: string
  rewardId: string
  reward: RoveReward
  ticketsSpent: number
  code: string            // 6 chars alfanumérico para presentar en negocio
  status: RedemptionStatus
  expiresAt: string
  usedAt?: string
  createdAt: string
}

// ── Demo data ──────────────────────────────────────────────────────────────────

const DEMO_USER_ID = 'demo-user'

// Boletos ganados por el usuario demo
const demoTickets: RoveTicket[] = [
  { id: 't1', userId: DEMO_USER_ID, amount: 2, reason: 'reservation', referenceId: 'res-001', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 't2', userId: DEMO_USER_ID, amount: 1, reason: 'review', referenceId: 'rev-001', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 't3', userId: DEMO_USER_ID, amount: 2, reason: 'weekly_bonus', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 't4', userId: DEMO_USER_ID, amount: 1, reason: 'reservation', referenceId: 'res-002', createdAt: new Date(Date.now() - 9 * 86400000).toISOString() },
]

// Catálogo de recompensas (en producción viene de la tabla rove_rewards)
export const demoRewards: RoveReward[] = [
  {
    id: 'r1', bizId: 'lupita', bizName: 'La Lupita Taco & Mezcal', bizLetter: 'L', bizColor: '#C25C3C',
    title: 'Bebida de cortesía', description: 'Mezcal, cerveza artesanal o agua fresca de temporada. Válido en cualquier visita.',
    ticketCost: 4, category: 'food', stock: null, validDays: 30, status: 'active',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'r2', bizId: 'azul', bizName: 'Cabo Azul Sunset Sail', bizLetter: 'A', bizColor: '#2B6CB0',
    title: 'Upgrade a la cubierta VIP', description: 'Accede a la zona premium del catamarán con snacks y mejor vista al atardecer.',
    ticketCost: 8, category: 'upgrade', stock: 10, validDays: 60, status: 'active',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'r3', bizId: 'reva', bizName: 'Reva', bizLetter: 'R', bizColor: '#E8505B',
    title: '10% en tu próxima reserva', description: 'Descuento aplicado automáticamente al confirmar cualquier reserva en Reva.',
    ticketCost: 5, category: 'discount', stock: null, validDays: 90, status: 'active',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'r4', bizId: 'huerta', bizName: 'Huerta del Mar', bizLetter: 'H', bizColor: '#276749',
    title: 'Postre de cortesía', description: 'Flan napolitano o helado artesanal de la temporada al final de tu cena.',
    ticketCost: 3, category: 'food', stock: 20, validDays: 45, status: 'active',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'r5', bizId: 'dorado', bizName: 'El Dorado Beach Club', bizLetter: 'D', bizColor: '#B7791F',
    title: 'Entrada al beach club', description: 'Acceso para 1 persona al día de playa. Incluye sombrilla y camastro.',
    ticketCost: 12, category: 'experience', stock: 5, validDays: 60, status: 'active',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
]

export interface RoveReferral {
  id: string
  referrerId: string           // quien compartió el código
  referredUserId: string       // quien se registró con el código
  code: string                 // código usado
  status: 'pending' | 'completed'  // pending = se registró, completed = hizo primera reserva
  createdAt: string
  completedAt?: string
}

// En memoria para el demo (simula la DB)
let _tickets: RoveTicket[] = [...demoTickets]
let _rewards: RoveReward[] = [...demoRewards]
let _redemptions: RoveRedemption[] = []
let _referrals: RoveReferral[] = []
const _referralCodes = new Map<string, string>() // userId → code

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// ── Balance ────────────────────────────────────────────────────────────────────

export function getBalance(userId: string): number {
  return _tickets
    .filter(t => t.userId === userId)
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getTicketHistory(userId: string): RoveTicket[] {
  return _tickets
    .filter(t => t.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// ── Emisión de boletos ─────────────────────────────────────────────────────────

export function issueTickets(
  userId: string,
  amount: number,
  reason: TicketReason,
  referenceId?: string,
): RoveTicket {
  const ticket: RoveTicket = {
    id: generateId(),
    userId,
    amount,
    reason,
    referenceId,
    createdAt: new Date().toISOString(),
  }
  _tickets.push(ticket)
  return ticket
}

// ── Catálogo ───────────────────────────────────────────────────────────────────

export function getActiveRewards(): RoveReward[] {
  return _rewards.filter(r => r.status === 'active')
}

export function getAllRewards(): RoveReward[] {
  return [..._rewards]
}

export function getRewardsByBiz(bizId: string): RoveReward[] {
  return _rewards.filter(r => r.bizId === bizId)
}

export function proposeReward(
  bizId: string,
  bizName: string,
  bizLetter: string,
  bizColor: string,
  data: Pick<RoveReward, 'title' | 'description' | 'ticketCost' | 'category' | 'stock' | 'validDays'>,
): RoveReward {
  const reward: RoveReward = {
    id: generateId(),
    bizId, bizName, bizLetter, bizColor,
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  _rewards.push(reward)
  return reward
}

export function reviewReward(
  rewardId: string,
  decision: 'active' | 'rejected' | 'paused',
  ticketCost?: number,
  rejectionReason?: string,
): RoveReward | null {
  const idx = _rewards.findIndex(r => r.id === rewardId)
  if (idx === -1) return null
  _rewards[idx] = {
    ..._rewards[idx],
    status: decision,
    ...(ticketCost !== undefined ? { ticketCost } : {}),
    ...(rejectionReason ? { rejectionReason } : {}),
  }
  return _rewards[idx]
}

// ── Canje ──────────────────────────────────────────────────────────────────────

export type RedeemResult =
  | { ok: true; redemption: RoveRedemption }
  | { ok: false; error: 'insufficient_tickets' | 'reward_not_found' | 'out_of_stock' }

export function redeemReward(userId: string, rewardId: string): RedeemResult {
  const reward = _rewards.find(r => r.id === rewardId && r.status === 'active')
  if (!reward) return { ok: false, error: 'reward_not_found' }

  const balance = getBalance(userId)
  if (balance < reward.ticketCost) return { ok: false, error: 'insufficient_tickets' }

  if (reward.stock !== null && reward.stock <= 0) return { ok: false, error: 'out_of_stock' }

  // Descontar boletos
  issueTickets(userId, -reward.ticketCost, 'redemption')

  // Reducir stock si aplica
  if (reward.stock !== null) {
    const idx = _rewards.findIndex(r => r.id === rewardId)
    _rewards[idx] = { ..._rewards[idx], stock: (_rewards[idx].stock as number) - 1 }
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + reward.validDays * 86400000)

  const redemption: RoveRedemption = {
    id: generateId(),
    userId,
    rewardId,
    reward,
    ticketsSpent: reward.ticketCost,
    code: generateCode(),
    status: 'pending',
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  }
  _redemptions.push(redemption)
  return { ok: true, redemption }
}

export function getUserRedemptions(userId: string): RoveRedemption[] {
  const now = new Date().toISOString()
  // Auto-expirar
  _redemptions = _redemptions.map(r =>
    r.status === 'pending' && r.expiresAt < now ? { ...r, status: 'expired' } : r
  )
  return _redemptions
    .filter(r => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// ── Validación en negocio ──────────────────────────────────────────────────────

export type ValidateResult =
  | { ok: true; redemption: RoveRedemption }
  | { ok: false; error: 'not_found' | 'already_used' | 'expired' }

export function validateRedemptionCode(code: string, bizId: string): ValidateResult {
  const idx = _redemptions.findIndex(r => r.code === code.toUpperCase())
  if (idx === -1) return { ok: false, error: 'not_found' }

  const r = _redemptions[idx]

  if (r.status === 'used') return { ok: false, error: 'already_used' }
  if (r.status === 'expired' || r.expiresAt < new Date().toISOString())
    return { ok: false, error: 'expired' }

  // Marcar como usado
  _redemptions[idx] = { ...r, status: 'used', usedAt: new Date().toISOString() }
  return { ok: true, redemption: _redemptions[idx] }
}

// ── Referidos ──────────────────────────────────────────────────────────────────

function generateReferralCode(userId: string): string {
  // 6 chars alfanumérico basado en userId + salt
  const seed = userId + Math.random().toString(36)
  return seed.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase().padEnd(6, 'X')
}

export function getReferralCode(userId: string): string {
  if (!_referralCodes.has(userId)) {
    _referralCodes.set(userId, generateReferralCode(userId))
  }
  return _referralCodes.get(userId)!
}

export type ApplyReferralResult =
  | { ok: true; referral: RoveReferral }
  | { ok: false; error: 'code_not_found' | 'self_referral' | 'already_used' }

export function applyReferralCode(code: string, newUserId: string): ApplyReferralResult {
  const upperCode = code.toUpperCase()

  // Encontrar al referidor por su código
  let referrerId: string | null = null
  for (const [uid, c] of _referralCodes.entries()) {
    if (c === upperCode) { referrerId = uid; break }
  }
  if (!referrerId) return { ok: false, error: 'code_not_found' }
  if (referrerId === newUserId) return { ok: false, error: 'self_referral' }

  // Verificar que el nuevo usuario no haya usado ya un código
  if (_referrals.some(r => r.referredUserId === newUserId)) return { ok: false, error: 'already_used' }

  const referral: RoveReferral = {
    id: generateId(),
    referrerId,
    referredUserId: newUserId,
    code: upperCode,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  _referrals.push(referral)
  return { ok: true, referral }
}

// Llamar cuando el usuario referido completa su primera reserva
export function completeReferral(referredUserId: string): { credited: boolean; referrerId?: string } {
  const idx = _referrals.findIndex(r => r.referredUserId === referredUserId && r.status === 'pending')
  if (idx === -1) return { credited: false }

  _referrals[idx] = { ..._referrals[idx], status: 'completed', completedAt: new Date().toISOString() }
  const referrerId = _referrals[idx].referrerId

  // Acreditar +5 boletos al referidor
  issueTickets(referrerId, 5, 'referral', referredUserId)

  return { credited: true, referrerId }
}

export function getReferralStats(userId: string) {
  const code = getReferralCode(userId)
  const sent = _referrals.filter(r => r.referrerId === userId)
  return {
    code,
    totalReferred: sent.length,
    completed: sent.filter(r => r.status === 'completed').length,
    pending: sent.filter(r => r.status === 'pending').length,
  }
}

export const TICKET_EARN_RULES: Record<TicketReason, { amount: number; label: string }> = {
  reservation: { amount: 2, label: 'Completar una reserva' },
  review:       { amount: 1, label: 'Dejar una reseña' },
  referral:     { amount: 5, label: 'Referir un amigo' },
  weekly_bonus: { amount: 1, label: 'Bono semanal' },
  redemption:   { amount: 0, label: 'Canje de recompensa' },
}

export const CATEGORY_LABEL: Record<RewardCategory, string> = {
  food:       'Comida & bebida',
  experience: 'Experiencia',
  discount:   'Descuento',
  upgrade:    'Upgrade',
}

export const CATEGORY_EMOJI: Record<RewardCategory, string> = {
  food:       '🍽️',
  experience: '🌅',
  discount:   '🏷️',
  upgrade:    '⭐',
}
