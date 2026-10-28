/**
 * Thin API client for the VeriTrace-X FastAPI backend.
 * Base URL: Vite dev server proxies `/api` -> backend (see vite.config.js).
 */
const API_PREFIX = '/api/v1'

const TOKEN_KEY = 'vtx_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function request(path, { method = 'GET', body, headers = {}, auth = true, raw = false } = {}) {
  const opts = { method, headers: { ...headers } }

  if (body instanceof FormData) {
    opts.body = body // browser sets multipart boundary
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }

  if (auth) {
    const token = getToken()
    if (token) opts.headers['Authorization'] = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_PREFIX}${path}`, opts)
  } catch {
    throw new ApiError('Could not reach the server. Is the backend running?', 0, null)
  }

  if (raw) return res

  const text = await res.text()
  const data = text ? safeJson(text) : null

  if (!res.ok) {
    const detail = data?.detail || res.statusText || 'Request failed'
    throw new ApiError(typeof detail === 'string' ? detail : 'Request failed', res.status, data)
  }
  return data
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ── Endpoints ──
export const api = {
  health: () => request('/health', { auth: false }),

  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  uploadDataset: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('/datasets/upload', { method: 'POST', body: fd })
  },
  getDataset: (id) => request(`/datasets/${id}`),
  sampleTemplateUrl: `${API_PREFIX}/datasets/sample/template`,
  sampleExampleUrl: `${API_PREFIX}/datasets/sample/example`,

  dashboardSummary: () => request('/dashboard/summary'),
}
