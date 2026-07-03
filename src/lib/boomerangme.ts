const BASE_URL = 'https://api.boomerangme.net/v1'

/** A value is real when it's set and not one of the repo's `your_…` placeholders. */
function realEnv(v: string | undefined): boolean {
  return Boolean(v && v.trim() && !v.startsWith('your_') && !v.includes('placeholder'))
}

/** True when the platform has connected BoomerangMe (keys live in env, not the DB). */
export function bmConfigured(): boolean {
  return realEnv(process.env.BOOMERANGME_API_KEY) && realEnv(process.env.BOOMERANGME_CAMPAIGN_ID)
}

function bmHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.BOOMERANGME_API_KEY}`,
  }
}

const CAMPAIGN = () => process.env.BOOMERANGME_CAMPAIGN_ID

// ── Customer-app flows (referenced by platform user id) ────────────────────────
export async function issueStamp(userId: string, businessId: string, count = 1) {
  const res = await fetch(`${BASE_URL}/stamps`, {
    method: 'POST',
    headers: bmHeaders(),
    body: JSON.stringify({ campaign_id: CAMPAIGN(), customer_id: userId, business_id: businessId, count }),
  })
  if (!res.ok) throw new Error('BoomerangMe stamp failed')
  return res.json()
}

export async function getCustomerStamps(userId: string) {
  const res = await fetch(
    `${BASE_URL}/customers/${userId}/stamps?campaign_id=${CAMPAIGN()}`,
    { headers: bmHeaders() }
  )
  if (!res.ok) throw new Error('BoomerangMe fetch failed')
  return res.json()
}

export async function redeemReward(userId: string, rewardId: string) {
  const res = await fetch(`${BASE_URL}/rewards/redeem`, {
    method: 'POST',
    headers: bmHeaders(),
    body: JSON.stringify({ customer_id: userId, reward_id: rewardId }),
  })
  if (!res.ok) throw new Error('BoomerangMe redeem failed')
  return res.json()
}

// ── POS / Escáner flows (referenced by the pass's Card Serial Number) ──────────
// The /biz Escáner scans a customer's Rove QR, decodes the Card Serial Number and
// runs the transaction against the business's campaign with the platform keys.

/** Look up a pass (current stamps/points, customer, reward) by its Card Serial Number. */
export async function getCardBySerial(serial: string) {
  const res = await fetch(
    `${BASE_URL}/cards/${encodeURIComponent(serial)}?campaign_id=${CAMPAIGN()}`,
    { headers: bmHeaders() }
  )
  if (!res.ok) throw new Error('BoomerangMe card lookup failed')
  return res.json()
}

export async function issueStampBySerial(serial: string, businessId: string, count = 1) {
  const res = await fetch(`${BASE_URL}/stamps`, {
    method: 'POST',
    headers: bmHeaders(),
    body: JSON.stringify({ campaign_id: CAMPAIGN(), card_serial: serial, business_id: businessId, count }),
  })
  if (!res.ok) throw new Error('BoomerangMe stamp failed')
  return res.json()
}

export async function addPointsBySerial(serial: string, businessId: string, count: number) {
  const res = await fetch(`${BASE_URL}/points`, {
    method: 'POST',
    headers: bmHeaders(),
    body: JSON.stringify({ campaign_id: CAMPAIGN(), card_serial: serial, business_id: businessId, count }),
  })
  if (!res.ok) throw new Error('BoomerangMe points failed')
  return res.json()
}

export async function redeemRewardBySerial(serial: string, businessId: string, rewardId?: string) {
  const res = await fetch(`${BASE_URL}/rewards/redeem`, {
    method: 'POST',
    headers: bmHeaders(),
    body: JSON.stringify({ campaign_id: CAMPAIGN(), card_serial: serial, business_id: businessId, reward_id: rewardId }),
  })
  if (!res.ok) throw new Error('BoomerangMe redeem failed')
  return res.json()
}
