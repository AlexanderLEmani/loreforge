/** Версия формата гостя — при смене сбрасываем localStorage. */
export const GUEST_CREDS_VERSION = '3'

/** Email/пароль для гостя — формат, который принимает Supabase Auth. */
export function createGuestCredentials() {
  const id = crypto.randomUUID().replace(/-/g, '')
  const email = `ioann${id.slice(0, 28)}@example.com`
  const password = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`
  return { email, password }
}

/** Старый битый формат (guest-uuid@users.loreforge.app). */
export function isLegacyGuestEmail(email: string) {
  return (
    email.includes('users.loreforge.app')
    || email.includes('@test.com')
    || /^guest-[a-f0-9-]+@/i.test(email)
  )
}
