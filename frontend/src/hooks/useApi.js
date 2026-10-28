import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/api'

/**
 * Run an async API function and track loading/data/error.
 * `fn` should be stable (wrap in useCallback) or listed via `deps`.
 */
export function useApi(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const run = useCallback(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.resolve(fn())
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e instanceof ApiError ? e.message : 'Request failed'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => run(), [run])

  return { data, loading, error, reload: run, setData }
}
