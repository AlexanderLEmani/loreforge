import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  createGuestCredentials,
  GUEST_CREDS_VERSION,
  isLegacyGuestEmail,
} from '@/lib/guest-credentials'

const GUEST_EMAIL_KEY = 'loreforge_guest_email'
const GUEST_PASS_KEY = 'loreforge_guest_pass'
const GUEST_VERSION_KEY = 'loreforge_guest_version'

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

async function createGuestViaApi(): Promise<{ email: string; password: string } | null> {
  try {
    const res = await fetch('/api/auth/guest', { method: 'POST' })
    if (!res.ok) return null
    const body = await res.json() as { email?: string; password?: string }
    if (!body.email || !body.password) return null
    return { email: body.email, password: body.password }
  } catch {
    return null
  }
}

async function createGuestViaSignUp(supabase: SupabaseClient): Promise<GuestAuthResult> {
  const { email, password } = createGuestCredentials()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { guest: true, display_name: 'Гость' } },
  })

  if (error) return { user: null, errorMessage: error.message }

  if (data.session?.user) {
    storeGuestCreds(email, password)
    return { user: data.session.user, errorMessage: null }
  }

  if (data.user) {
    const signIn = await signInWithCreds(supabase, email, password)
    if (signIn.user) return signIn
  }

  return { user: null, errorMessage: 'Регистрация гостя не дала сессию. Отключи подтверждение email в Supabase Auth.' }
}

/** Гостевой вход: anonymous → API (без писем) → сохранённые креды → signUp */
export async function signInAsGuest(supabase: SupabaseClient): Promise<GuestAuthResult> {
  const anon = await supabase.auth.signInAnonymously()
  if (anon.data.user && !anon.error) {
    return { user: anon.data.user, errorMessage: null }
  }

  const fromApi = await createGuestViaApi()
  if (fromApi) {
    const fromApiSignIn = await signInWithCreds(supabase, fromApi.email, fromApi.password)
    if (fromApiSignIn.user) return fromApiSignIn
  }

  const stored = readGuestCreds()
  if (stored) {
    const fromStored = await signInWithCreds(supabase, stored.email, stored.password)
    if (fromStored.user) return fromStored
  }

  const fromSignUp = await createGuestViaSignUp(supabase)
  if (fromSignUp.user) return fromSignUp

  const hint = fromSignUp.errorMessage ?? anon.error?.message ?? 'Неизвестная ошибка'
  return { user: null, errorMessage: hint }
}

export async function guestLandingPath(supabase: SupabaseClient, userId: string) {
  const { data: ch } = await supabase
    .from('characters')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return ch ? '/hub' : '/create-character'
}
