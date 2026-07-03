// Rove ↔ BoomerangMe card identity.
//
// Flow (matches the real BoomerangMe model):
//   1. The platform (super admin) holds the BoomerangMe account/keys; each business has a
//      loyalty campaign (stamp card / points / etc.).
//   2. A customer who joins a business's Rove program gets a BoomerangMe pass, identified by
//      its unique Card Serial Number. The consumer app (/app · Rove) renders that pass's
//      barcode as a QR on each loyalty card.
//   3. Staff open the Escáner in /biz, point the camera at the customer's QR (or type the
//      Card Serial Number), and run a transaction — accrue a stamp, add points, or redeem a
//      reward — against that business's campaign via the platform BoomerangMe keys.
//
// `roveToken` is the value encoded in the QR; `parseRoveToken` decodes a scan or a manually
// typed serial. In the demo these resolve against local sample members; in production the
// serial is looked up through the BoomerangMe API (see src/lib/boomerangme.ts).

export type RoveProgram = 'stamps' | 'points'

const PREFIX = 'RV1'

export type RoveTokenData = { serial: string; program: RoveProgram }

/** Encode the value carried by a card's QR / wallet-pass barcode. */
export function roveToken({ serial, program }: RoveTokenData): string {
  return `${PREFIX}|${serial}|${program}`
}

/** Decode a scanned QR, a wallet deep link, or a manually typed Card Serial Number. */
export function parseRoveToken(raw: string): RoveTokenData | null {
  const s = raw.trim()
  if (!s) return null
  if (s.startsWith(`${PREFIX}|`)) {
    const [, serial, program] = s.split('|')
    if (!serial) return null
    return { serial: serial.toUpperCase(), program: program === 'points' ? 'points' : 'stamps' }
  }
  // Manual entry / search by Card Serial Number (BoomerangMe scanner fallback)
  if (/^[A-Z0-9-]{4,}$/i.test(s)) return { serial: s.toUpperCase(), program: 'stamps' }
  return null
}

// Card serials shared between the consumer app and the business demo data, so a real
// cross-device scan resolves to the same member on both sides.
export const ROVE_SERIALS = {
  tacoClub: 'RV-LUP-7F3K9',
  marinero: 'RV-AZUL-2M8Q4',
} as const
