import { useAuthStore } from '../store/auth'

function redirectToLogin() {
  try {
    const from = window.location.pathname + window.location.search + window.location.hash
    const url = new URL('/login', window.location.origin)
    url.searchParams.set('from', from)
    window.location.assign(url.toString())
  } catch {
    window.location.assign('/login')
  }
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { token, logout } = useAuthStore.getState()

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(input, { ...init, headers })
  if (res.status === 401) {
    logout()
    redirectToLogin()
  }
  return res
}

