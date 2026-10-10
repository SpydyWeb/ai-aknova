// Storage for hosts with no disk of their own, such as Vercel. The content is still plain files,
// content/site.json and content/uploads/, but they are kept in the site's GitHub repository:
// each save is a commit, and the host rebuilds the site from it about a minute later.
//
// Needs two settings on the host:
//   GITHUB_REPO   owner/name of the repository, for example SpydyWeb/ai-aknova
//   GITHUB_TOKEN  a fine-grained token with "Contents: read and write" on that one repository
// Optional: GITHUB_BRANCH (default main) and GITHUB_DIR (the app's folder, if it is not the repository root).
import { extname } from 'node:path'

// An error whose message is safe and useful to show in the admin panel.
export class StoreError extends Error {}

export function githubStore({ token, repo, branch = 'main', dir = '', allowed, types }) {
  const api = (process.env.GITHUB_API || 'https://api.github.com').replace(/\/+$/, '')
  const full = (p) => [dir.replace(/^\/+|\/+$/g, ''), p].filter(Boolean).join('/')
  const at = (p) => `${api}/repos/${repo}/contents/${full(p).split('/').map(encodeURIComponent).join('/')}`
  const SITE = 'content/site.json'
  const UPLOADS = 'content/uploads'

  async function gh(url, { raw = false, ...opts } = {}) {
    let res
    try {
      res = await fetch(url, {
        ...opts,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'aknova-admin',
          ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        },
      })
    } catch {
      throw new StoreError('GitHub could not be reached. Try again in a moment.')
    }
    if (res.status === 404) return null
    if (res.status === 401 || res.status === 403) throw new StoreError('GitHub refused the access token. Check that GITHUB_TOKEN is current and has "Contents: read and write" on the repository.')
    if (res.status === 409 || res.status === 422) throw new StoreError('The content changed somewhere else while you were editing. Reload the admin panel and try again.')
    if (!res.ok) throw new StoreError(`GitHub answered with an error (${res.status}). Try again in a moment.`)
    return res
  }
  const sha = async (p) => (await (await gh(`${at(p)}?ref=${encodeURIComponent(branch)}`))?.json())?.sha
  const put = async (p, buffer, message) => {
    const res = await gh(at(p), { method: 'PUT', body: JSON.stringify({ message, branch, content: buffer.toString('base64'), sha: await sha(p) }) })
    if (!res) throw new StoreError(`The repository ${repo} or its branch ${branch} was not found. Check GITHUB_REPO and GITHUB_BRANCH.`)
  }

  async function read(ref = branch) {
    const res = await gh(`${at(SITE)}?ref=${encodeURIComponent(ref)}`, { raw: true })
    if (!res) throw new StoreError(`content/site.json was not found in ${repo}. Check GITHUB_REPO, GITHUB_BRANCH and GITHUB_DIR.`)
    return JSON.parse(await res.text())
  }
  const write = (data, message = 'Update site content from the admin panel') => put(SITE, Buffer.from(JSON.stringify(data, null, 2) + '\n'), message)

  // Earlier versions are the earlier commits of site.json.
  async function backups() {
    const res = await gh(`${api}/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(full(SITE))}&per_page=31`)
    const list = res ? await res.json() : []
    return list.slice(1).map((c) => ({ name: c.sha, time: Date.parse(c.commit?.committer?.date || c.commit?.author?.date) }))
  }
  async function restore(name) {
    if (!/^[0-9a-f]{40}$/.test(String(name))) return null
    const data = await read(name)
    return data
  }

  async function media() {
    const res = await gh(`${at(UPLOADS)}?ref=${encodeURIComponent(branch)}`)
    const list = res ? await res.json() : []
    return (Array.isArray(list) ? list : [])
      .filter((f) => f.type === 'file' && allowed.includes(extname(f.name).toLowerCase()))
      .map((f) => ({ name: f.name, url: `/uploads/${f.name}`, size: f.size, time: 0, type: (types[extname(f.name).toLowerCase()] || '').split('/')[0] }))
  }
  const taken = async () => (await media()).map((m) => m.name)
  const upload = (name, buffer) => put(`${UPLOADS}/${name}`, buffer, `Add ${name} from the admin panel`)
  async function remove(name) {
    const found = await sha(`${UPLOADS}/${name}`)
    if (!found) return false
    await gh(at(`${UPLOADS}/${name}`), { method: 'DELETE', body: JSON.stringify({ message: `Remove ${name} from the admin panel`, branch, sha: found }) })
    return true
  }
  // A file uploaded since the last rebuild is not on the host yet, so it is fetched from the repository.
  async function file(name) {
    const res = await gh(`${at(`${UPLOADS}/${name}`)}?ref=${encodeURIComponent(branch)}`, { raw: true })
    return res ? Buffer.from(await res.arrayBuffer()) : null
  }

  return { read: () => read(), write, backups, restore, media, taken, upload, remove, file }
}
