// Loads the business that belongs to the currently logged-in owner.
// The panel (/biz) uses this to render the owner's real business instead of the
// baked-in demo verticals. Runs on the client with the user's session.
import { createClient } from './supabase/client'

export interface OwnerService {
  id: string
  name: string
  description: string | null
  price: number | null
  price_label: string | null
  duration_min: number | null
  active: boolean | null
  scheduled: boolean | null
  image_url: string | null
}

export interface OwnerBusiness {
  id: string
  name: string
  full_name: string | null
  type: string | null
  kind: string | null
  hood: string | null
  municipio: string | null
  hours: string | null
  capacity: number | null
  rfc: string | null
  address: string | null
  phone: string | null
  grad_from: string | null
  grad_to: string | null
  mono: string | null
  agent_active: boolean | null
  onboarded: boolean | null
  agent_config: Record<string, unknown> | null
  tax_mode: string | null
  services: OwnerService[]
}

export interface OwnerSession {
  userId: string | null
  email: string | null
  businesses: OwnerBusiness[]
}

// Returns { userId: null } when there is no session — callers should redirect to
// /biz/login. When there is a session but no business yet, `businesses` is empty
// and the caller should send the owner through onboarding.
export async function loadOwnerSession(): Promise<OwnerSession> {
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return { userId: null, email: null, businesses: [] }

  const { data: memberRows } = await supabase
    .from('biz_members')
    .select('biz_id')
    .eq('user_id', user.id)

  const bizIds = (memberRows ?? []).map(r => r.biz_id).filter(Boolean) as string[]
  if (bizIds.length === 0) {
    return { userId: user.id, email: user.email ?? null, businesses: [] }
  }

  const { data: bizRows } = await supabase
    .from('businesses')
    .select('id,name,full_name,type,kind,hood,municipio,hours,capacity,rfc,address,phone,grad_from,grad_to,mono,agent_active,onboarded,agent_config,tax_mode')
    .in('id', bizIds)

  const { data: svcRows } = await supabase
    .from('services')
    .select('id,biz_id,name,description,price,price_label,duration_min,active,scheduled,image_url')
    .in('biz_id', bizIds)

  const businesses: OwnerBusiness[] = (bizRows ?? []).map(b => ({
    ...b,
    services: (svcRows ?? [])
      .filter(s => s.biz_id === b.id)
      .map(({ biz_id: _biz_id, ...s }) => s),
  }))

  return { userId: user.id, email: user.email ?? null, businesses }
}
