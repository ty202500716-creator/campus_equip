import { useCallback, useEffect, useState } from 'react'

export const API = 'http://localhost:5000'

export async function api(path, { body, ...opts } = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed.')
  return data
}

export const getUser = () => JSON.parse(localStorage.getItem('user') || 'null')

export function useApi(path, initial = []) {
  const [data, setData] = useState(initial)
  const [error, setError] = useState('')
  const reload = useCallback(
    () => api(path).then(setData).catch((e) => setError(e.message)),
    [path]
  )
  useEffect(() => { reload() }, [reload])
  return { data, error, reload }
}
