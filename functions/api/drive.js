// functions/api/drive.js
// Cloudflare Pages Function — lists the public Drive folder server-side so the
// API key never reaches the browser. Auto-served at /api/drive (Cloudflare picks
// up the functions/ directory automatically; it is not part of the Vite build).
//
// Configure in Cloudflare → your Pages project → Settings → Environment variables:
//   DRIVE_API_KEY    your Google Drive API key   (add as an encrypted secret)
//   DRIVE_FOLDER_ID  the folder ID (the part after /folders/)
//
// The key must be restricted to the "Google Drive API" only and must NOT carry an
// HTTP-referrer restriction — this server-side call sends no referer, so a
// referrer-restricted key is rejected. The folder stays link-public.

export async function onRequestGet({ env }) {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // Cache at the edge for 5 min so repeat visits don't re-hit Google.
        'cache-control': 'public, max-age=300',
      },
    })

  const key = env.DRIVE_API_KEY
  const folderId = env.DRIVE_FOLDER_ID
  if (!key || !folderId) {
    return json({ error: 'Drive not configured (set DRIVE_API_KEY and DRIVE_FOLDER_ID)' }, 500)
  }

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    key,
    fields: 'files(id,name,mimeType,modifiedTime)',
    orderBy: 'name',
    pageSize: '100',
  })

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return json({ error: data.error?.message || `Drive API ${res.status}` }, res.status)
  }
  return json({ files: data.files || [] })
}
