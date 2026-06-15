import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  createGuestCredentials,
  GUEST_CREDS_VERSION,
  isLegacyGuestEmail,
} from '@/lib/guest-credentials'

const GUEST_EMAIL_KEY = 'loreheim_guest_email'
const GUEST_PASS_KEY = 'loreheim_guest_pass'
const GUEST_VERSION_KEY = 'loreheim_guest_version'

export function clearGuestCreds() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_EMAIL_KEY)
  localStorage.removeItem(GUEST_PASS_KEY)
  localStorage.removeItem(GUEST_VERSION_KEY)
}

function storeGuestCreds(email: string, password: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_EMAIL_KEY, email)
  localStorage.setItem(GUEST_PASS_KEY, password)
  localStorage.setItem(GUEST_VERSION_KEY, GUEST_CREDS_VERSION)
}

function readGuestCreds(): { email: string; password: string } | null {
  if (typeof window === 'undefined') return null
  if (localStorage.getItem(GUEST_VERSION_KEY) !== GUEST_CREDS_VERSION) {
    clearGuestCreds()
    return null
  }
  const email = localStorage.getItem(GUEST_EMAIL_KEY)
  const password = localStorage.getItem(GUEST_PASS_KEY)
  if (!email || !password) return null
  if (isLegacyGuestEmail(email)) {
    clearGuestCreds()
    return null
  }
  return { email, password }
}

type GuestAuthResult = {
  user: User | null
  errorMessage: string | null
}

function isAnonymousDisabled(message: string) {
  return /anonymous sign-?ins? (are )?disabled/i.test(message)
}

/** Как в hub — без строки в users создание персонажа может упасть по FK. */
export async function ensureGuestUserRow(supabase: SupabaseClient, user: User) {
  await supabase.from('users').upsert({
    id: user.id,
    email: user.email ?? null,
    full_name:
      user.user_metadata?.full_name
      ?? user.user_metadata?.display_name
      ?? user.user_metadata?.name
      ?? 'Гость',
    avatar_url: user.user_metadata?.avatar_url ?? null,
  }, { onConflict: 'id' })
}

async function signInWithCreds(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<GuestAuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { user: null, errorMessage: error.message }
  if (!data.user) return { user: null, errorMessage: 'Нет пользователя после входа' }
  storeGuestCreds(email, password)
  return { user: data.user, errorMessage: null }
}

async function createGuestViaApi(supabase: SupabaseClient): Promise<GuestAuthResult> {
  try {
    const res = await fetch('/api/auth/guest', { method: 'POST' })
    if (!res.ok) return { user: null, errorMessage: null }
    const body = await res.json() as { email?: string; password?: string; error?: string }
    if (!body.email || !body.password) return { user: null, errorMessage: body.error ?? null }
    return signInWithCreds(supabase, body.email, body.password)
  } catch {
    return { user: null, errorMessage: null }
  }
}

/** Анонимный вход (без email). Fallback — только API с service role. */
export async function signInAsGuest(supabase: SupabaseClient): Promise<GuestAuthResult> {
  const anon = await supabase.auth.signInAnonymously()
  const anonUser = anon.data.session?.user ?? anon.data.user

  if (anonUser && !anon.error) {
    clearGuestCreds()
    return { user: anonUser, errorMessage: null }
  }

  const anonErr = anon.error?.message ?? ''
  if (anonErr && !isAnonymousDisabled(anonErr)) {
    return { user: null, errorMessage: anonErr }
  }

  if (!anonUser && !isAnonymousDisabled(anonErr)) {
    return {
      user: null,
      errorMessage: 'Анонимный вход не создал сессию. Обнови страницу (Cmd+Shift+R) и попробуй снова.',
    }
  }

  const stored = readGuestCreds()
  if (stored) {
    const fromStored = await signInWithCreds(supabase, stored.email, stored.password)
    if (fromStored.user) return fromStored
  }

  const fromApi = await createGuestViaApi(supabase)
  if (fromApi.user) return fromApi

  if (anonErr && isAnonymousDisabled(anonErr)) {
    return {
      user: null,
      errorMessage:
        'Включи Anonymous Sign-In: Supabase → Authentication → Providers → Anonymous → Enable.',
    }
  }

  return {
    user: null,
    errorMessage:
      fromApi.errorMessage
      ?? 'Не удалось войти. Проверь Anonymous Sign-In в Supabase или добавь SUPABASE_SERVICE_ROLE_KEY в Vercel.',
  }
}

export async function guestLandingPath(supabase: SupabaseClient, userId: string) {
  const { data: ch } = await supabase
    .from('characters')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return ch ? '/hub' : '/create-character'
}
