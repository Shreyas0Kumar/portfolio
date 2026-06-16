# Music

Drop royalty-free / non-copyright audio files into **this folder** and they'll
show up automatically inside the **Music** app on the desktop.

## Supported formats
`.mp3` · `.m4a` · `.ogg` · `.wav` · `.flac`

## Naming (optional but nice)
Name files as `Artist - Title.ext` and the app will split them, e.g.

```
Kevin MacLeod - Carefree.mp3   →   Carefree · Kevin MacLeod
lofi-beat.mp3                  →   lofi-beat · Unknown artist
```

## How it works
The app uses Vite's `import.meta.glob` to bundle everything in this folder at
build time. After adding files, **restart the dev server** (or rebuild) so they
get picked up.

## Where to find non-copyright music
- incompetech.com (Kevin MacLeod, CC-BY)
- freemusicarchive.org
- pixabay.com/music
- YouTube Audio Library

Keep attribution where the license requires it.
