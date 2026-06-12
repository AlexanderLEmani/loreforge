/** Версия формата гостя — при смене сбрасываем localStorage. */
export const GUEST_CREDS_VERSION = '4'

/** Email только для API createUser (service role). example.com/test.com Supabase блокирует. */
export function createGuestCredentials() {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20)
  const email = `lf${id}@gmail.com`
  const password = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`
  return { email, password }
}

export function isLegacyGuestEmail(email: string) {
  return (
    email.includes('users.loreforge.app')
    || email.includes('@example.com')
    || email.includes('@test.com')
    || /^guest-[a-f0-9-]+@/i.test(email)
    || /^ioann[a-f0-9]+@/i.test(email)
  )
}
