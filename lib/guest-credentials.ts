/** Email/пароль для гостя — формат, который принимает Supabase Auth. */
export function createGuestCredentials() {
  const id = crypto.randomUUID().replace(/-/g, '')
  // Без дефисов в local-part; короткий домен .com (users.loreforge.app отклоняется)
  const email = `ioann${id.slice(0, 24)}@test.com`
  const password = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`
  return { email, password }
}
