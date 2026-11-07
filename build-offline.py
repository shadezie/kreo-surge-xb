from pathlib import Path
import base64,re
root=Path(__file__).parent
p=root/'dist'
s=re.sub(r'\?v=\d+', '', (p/'index.html').read_text())
css=re.sub(r"@import url\([^;]+;",'',(p/'style.css').read_text())
s=s.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
for name in ['vendor/lucide.min.js','vendor/three.min.js','data.js','model.js','app.js']:
    code=(p/name).read_text()
    s=s.replace(f'<script src="{name}"></script>','<script>'+code.replace('</script','<\\/script')+'</script>')
# Embed the photos in a resolver, so dynamically opened manual pages also work offline.
photos={f.name:'data:image/jpeg;base64,'+base64.b64encode(f.read_bytes()).decode() for f in (p/'manual').glob('*.jpg')}
import json
s=s.replace('return `manual/IMG_${page}.jpg`;', 'return manualPhotos[`IMG_${page}.jpg`];')
s=s.replace('</body>','<script>const manualPhotos='+json.dumps(photos)+'</script></body>')
(root.parent/'Kreo-Surge-XB-Interactive-Guide.html').write_text(s)
print('Offline HTML created; includes 3D engine, guide content, and all eight manual photos.')
