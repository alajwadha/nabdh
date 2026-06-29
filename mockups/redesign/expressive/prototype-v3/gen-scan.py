import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>'
INK='#1F1C17';MUT='#80796C';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA';BLUE=('#D6EBF6','#2C5C77')
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:30px}}
.phone{{width:392px;background:#F7F1E8;border-radius:36px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.sheet{{background:#FFFBF4;border-radius:28px;padding:18px 20px 24px;box-shadow:0 -10px 40px rgba(20,16,10,.12)}}
.grip{{width:44px;height:5px;border-radius:99px;background:#E2D9C7;margin:0 auto 16px}}
.h2{{font-size:22px;font-weight:800;letter-spacing:-.4px;color:{INK};margin-bottom:14px}}
.cam{{height:200px;border-radius:16px;background:#0c0c0c;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}}
.rect{{width:62%;height:84px;border:2px solid rgba(255,255,255,.7);border-radius:12px}}
.scanline{{position:absolute;left:19%;right:19%;height:2px;background:#7FE0B4;box-shadow:0 0 10px #7FE0B4;top:50%}}
.card{{margin-top:16px;background:#FFFBF4;border:1px solid {BORD};border-radius:16px;padding:14px}}
.row{{display:flex;align-items:center;gap:13px}}
.btn{{position:relative;overflow:hidden;background:{GRN};color:#fff;border-radius:99px;padding:14px;text-align:center;font-size:16px;font-weight:700;margin-top:12px}}
.glare{{position:absolute;left:16%;top:-62%;width:68%;height:92%;border-radius:50%;background:rgba(255,255,255,.32);filter:blur(7px)}}
</style></head><body>
<div class="phone">
  <div class="sheet">
    <div class="grip"></div>
    <div class="h2">Scan barcode</div>
    <div class="cam"><div class="rect"></div><div class="scanline"></div></div>
    <div class="card">
      <div class="row">
        <div style="width:40px;height:40px;border-radius:12px;background:{BLUE[0]};display:flex;align-items:center;justify-content:center">{svg('scan-barcode',19,BLUE[1])}</div>
        <div style="flex:1"><div style="font-size:15px;font-weight:700;color:{INK}">Protein Bar</div><div style="font-size:12px;font-weight:600;color:{MUT}">Acme &middot; 60 g &middot; P21 C24 F7</div></div>
        <div style="text-align:right"><div style="font-size:17px;font-weight:800;color:{INK};font-variant-numeric:tabular-nums">240</div><div style="font-size:12px;font-weight:600;color:{MUT}">kcal</div></div>
      </div>
      <div class="btn"><div class="glare"></div><span style="position:relative">Add Protein Bar</span></div>
    </div>
    <div style="height:14px"></div>
    <div style="border:2px solid {BORD};border-radius:99px;padding:13px;text-align:center;font-size:15px;font-weight:700;color:{INK}">Done</div>
  </div>
</div>
</body></html>'''
open('screen-scan.html','w').write(html); print('ok')
