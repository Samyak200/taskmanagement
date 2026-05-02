/** Dev: relative `/api` proxied by Vite. Prod: set `VITE_API_URL` (e.g. https://api.example.com) */
const ORIGIN = import.meta.env.VITE_API_URL || ''

function authHeader() {
  const t = localStorage.getItem('accessToken')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

let refreshPromise = null

async function tryRefreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${ORIGIN}/api/auth/refresh-token`, {
      method: 'GET',
      credentials: 'include',
    }).finally(() => {
      refreshPromise = null
    })
  }
  const res = await refreshPromise
  if (!res.ok) return false
  const data = await res.json()
  if (data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken)
    return true
  }
  return false
}

/**
 * @param {string} path — e.g. `/api/me/stats`
 * @param {RequestInit & { skipAuthRetry?: boolean }} [options]
 */
export async function api(path, options = {}) {
  const { skipAuthRetry, headers, ...rest } = options
  const url = path.startsWith('http') ? path : `${ORIGIN}${path}`

  const withJson =
    rest.body !== undefined && typeof rest.body === 'string' && !headers?.['Content-Type']

  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      ...(withJson ? { 'Content-Type': 'application/json' } : {}),
      ...authHeader(),
      ...headers,
    },
    ...rest,
  })

  if (res.status === 401 && !skipAuthRetry) {
    const ok = await tryRefreshAccessToken()
    if (ok) {
      return fetch(url, {
        credentials: 'include',
        headers: {
          ...(withJson ? { 'Content-Type': 'application/json' } : {}),
          ...authHeader(),
          ...headers,
        },
        ...rest,
      })
    }
  }

  return res
}
