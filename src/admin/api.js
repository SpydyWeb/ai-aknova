// Talks to the server (server/core.mjs). Every call resolves to the answer or throws an Error
// whose message can be shown to the person as it is.
async function call(method, url, body) {
  let res
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: { 'X-Admin': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('The server did not answer. Check that the site is running, then try again.')
  }
  const isJson = (res.headers.get('content-type') || '').includes('json')
  if (!isJson) throw new Error('The admin panel needs the site server. Start it with "npm run dev" or "npm start".')
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { status: res.status })
  return data
}

export const api = {
  me: () => call('GET', '/api/admin/me'),
  setup: (email, password) => call('POST', '/api/admin/setup', { email, password }),
  login: (email, password) => call('POST', '/api/admin/login', { email, password }),
  logout: () => call('POST', '/api/admin/logout'),
  account: (current, email, next) => call('POST', '/api/admin/account', { current, email, next }),
  content: () => call('GET', '/api/content'),
  save: (doc) => call('PUT', '/api/content', doc),
  backups: () => call('GET', '/api/backups'),
  restore: (name) => call('POST', '/api/backups/restore', { name }),
  media: () => call('GET', '/api/media'),
  removeMedia: (name) => call('DELETE', `/api/media?name=${encodeURIComponent(name)}`),
  // Uploads one file and reports progress from 0 to 1.
  upload: (file, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/media?name=${encodeURIComponent(file.name)}`)
      xhr.setRequestHeader('X-Admin', '1')
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
      xhr.onerror = () => reject(new Error(`${file.name} did not upload. Check your connection and try again.`))
      xhr.onload = () => {
        let data = {}
        try {
          data = JSON.parse(xhr.responseText)
        } catch {
          /* not JSON: handled below */
        }
        if (xhr.status === 200) resolve(data)
        else reject(new Error(data.error || `${file.name} did not upload.`))
      }
      xhr.send(file)
    }),
}
