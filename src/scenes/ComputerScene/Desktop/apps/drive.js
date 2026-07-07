// drive.js
// Client-side helpers for the public Google Drive folder shown in Finder and on
// the desktop. The file list comes from a Cloudflare Pages Function
// (functions/api/drive.js) that holds the API key server-side, so no key ever
// ships to the browser. Upload to the Drive folder and everything here updates —
// no code changes, no redeploy.
//
// ── SETUP ─────────────────────────────────────────────────────────────────────
// 1. Drive folder → Share → "Anyone with the link → Viewer". Put your resume,
//    cover letter, and certificate PDFs inside.
// 2. Paste the folder's share link (or bare ID) into DRIVE_FOLDER below. This is
//    only used for the "Open in Google Drive" links and the keyless fallback
//    embed — it is NOT a secret.
// 3. In Cloudflare → your Pages project → Settings → Environment variables, add:
//        DRIVE_API_KEY    = your Google Drive API key   (add as an encrypted secret)
//        DRIVE_FOLDER_ID  = the folder ID (the part after /folders/)
//    Restrict the key to "Google Drive API" only, with NO HTTP-referrer
//    restriction (the server call has no referer). See functions/api/drive.js.
//
// Local note: plain `vite dev` has no Pages Function, so /api/drive 404s and
// Finder falls back to the keyless embed. To exercise the real in-app grid
// locally, build then run `npx wrangler pages dev dist` with a .dev.vars file.

export const DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1pyezInf40KQ-gukzlIMMTyvARPkKBKUa?usp=sharing'

// Accept a full share URL (…/folders/<id>?usp=…) or a bare ID, and reduce to ID.
function extractFolderId(value) {
  const v = (value || '').trim()
  const match = v.match(/\/folders\/([^/?#]+)/)
  return match ? match[1] : v
}

export const DRIVE_FOLDER_ID = extractFolderId(DRIVE_FOLDER)

// True once a folder is set (gates the Finder "Documents" view).
export const driveConfigured = DRIVE_FOLDER_ID.length > 0

// Keyless embedded folder view (fallback). #grid shows thumbnails; #list is denser.
export function driveEmbedUrl(view = 'grid') {
  return `https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER_ID}#${view}`
}

// Human-facing link to open the whole folder in a new tab.
export function driveFolderUrl() {
  return `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`
}

// Embeddable in-app preview for a single file (the /preview endpoint allows
// framing; /view does not).
export function drivePreviewUrl(id) {
  return `https://drive.google.com/file/d/${id}/preview`
}

// Full Google viewer for a file (used by the "open in new tab" escape hatch).
export function driveFileViewUrl(id) {
  return `https://drive.google.com/file/d/${id}/view`
}

// List the folder's files via our Pages Function (the API key stays server-side).
// Throws when the function is unavailable so callers can fall back to the embed.
export async function listDriveFiles() {
  const res = await fetch('/api/drive')
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) {
    throw new Error(data.error || `Drive list failed (${res.status})`)
  }
  return data.files || []
}

// Resolve the resume for the desktop "Resume" icon by name (so it tracks
// re-uploads with no code change). The résumé lives only in the Drive folder —
// there is no bundled PDF — so this returns null when the live list is
// unavailable or has no résumé, and callers fall back to opening the folder.
// Cached after the first successful lookup so repeat clicks open instantly.
let _resume = null
export async function resolveResume() {
  if (_resume) return _resume
  try {
    const files = await listDriveFiles()
    const match = files.find(f => /r[ée]sum[eé]/i.test(f.name))
    if (!match) return null
    _resume = {
      name: 'Shreyas Kumar · Résumé',
      src: drivePreviewUrl(match.id),
      openHref: driveFileViewUrl(match.id),
    }
    return _resume
  } catch {
    return null
  }
}
