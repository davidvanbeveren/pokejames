"""Bundle the game into dist/:
   dist/index.html    - the page with every script inlined (open directly in a browser)
   dist/artifact.html - same page without the document skeleton (for hosts that wrap it, e.g. Artifacts)
   dist/audio/        - the music, copied alongside

The music is too big to inline by default (see AUDIO_EMBED_LIMIT). Pass --embed to
turn the <audio> sources into data: URIs and get genuinely single-file output; that
only fits if the tracks are re-encoded smaller (BITRATE=64k tools/encode_music.sh ...).
"""
import base64, mimetypes, os, re, shutil, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
EMBED = '--embed' in sys.argv
AUDIO_EMBED_LIMIT = 15 * 1024 * 1024  # Artifacts reject pages over 16MB; leave headroom
MEDIA_RE = r'src="((?:audio|art)/[^"]+)"'

html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()


def inline_script(m):
    src = m.group(1).split('?')[0]
    p = os.path.join(ROOT, src)
    if not os.path.exists(p):
        print('warning: missing', src); return ''
    code = open(p, encoding='utf-8').read().replace('</script', '<\\/script')
    return '<script>\n' + code + '\n</script>'


def inline_media(m):
    """Turn src="audio/pallet.mp3" into a data: URI."""
    src = m.group(1).split('?')[0]
    p = os.path.join(ROOT, src)
    if not os.path.exists(p):
        print('warning: missing', src); return m.group(0)
    mime = mimetypes.guess_type(src)[0] or 'application/octet-stream'
    data = base64.b64encode(open(p, 'rb').read()).decode('ascii')
    return 'src="data:%s;base64,%s"' % (mime, data)


full = re.sub(r'<script src="([^"]+)"></script>', inline_script, html)

# ---- media: either inlined, or copied next to the page and left as relative paths
media = sorted({m.split('?')[0] for m in re.findall(MEDIA_RE, full)})
media_bytes = sum(os.path.getsize(os.path.join(ROOT, m)) for m in media if os.path.exists(os.path.join(ROOT, m)))
if EMBED:
    full = re.sub(MEDIA_RE, inline_media, full)

# dist/ is opened as a local file, where a ?v= query can break file:// resolution --
# and it needs no cache busting anyway, so drop the stamps from the bundle.
full = re.sub(r'(src="[^"]+?)\?v=[0-9a-f]+"', r'\1"', full)

os.makedirs(DIST, exist_ok=True)
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(full)

# skeleton-free variant: <title> + <style> from head, then body content
title = re.search(r'<title>(.*?)</title>', full, re.S).group(1)
style = re.search(r'<style>(.*?)</style>', full, re.S).group(1)
body = re.search(r'<body[^>]*>(.*)</body>', full, re.S).group(1)
art = '<title>' + title + '</title>\n<style>' + style + '</style>\n' + body
open(os.path.join(DIST, 'artifact.html'), 'w', encoding='utf-8').write(art)

kb = lambda n: str(n // 1024) + ' KB'
print('dist/index.html', kb(len(full.encode())) + ';', 'dist/artifact.html', kb(len(art.encode())))

if not media:
    pass
elif EMBED:
    if len(art.encode()) > AUDIO_EMBED_LIMIT:
        print('warning: embedded page is over %s — too big for Artifacts. Re-encode the' % kb(AUDIO_EMBED_LIMIT))
        print('         music smaller, e.g. BITRATE=64k tools/encode_music.sh <src> <name>')
else:
    for rel in media:
        dst = os.path.join(DIST, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, rel), dst)
    print('dist/audio/', len(media), 'files,', kb(media_bytes), '- keep it next to index.html')
    print('             (--embed folds it into the page instead)')
