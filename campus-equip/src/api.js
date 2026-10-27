import { useCallback, useEffect, useState } from 'react'

export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function api(path, { body, ...opts } = {}) {
  let res
  try {
    res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // fetch only throws when the server can't be reached at all
    throw new Error(`Cannot reach the server at ${API}. Start the backend first: open a terminal, cd server, then run npm start.`)
  }
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
