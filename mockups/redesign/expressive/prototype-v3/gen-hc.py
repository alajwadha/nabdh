import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
MINT=('#D8EFE2','#1E5A40')
types=[('Steps & activity','footprints'),('Heart rate','heart'),('Sleep','moon'),('Distance','activity'),('Active calories','flame')]
rows=''
for i,(lab,ic) in enumerate(types):
    top='' if i==0 else f'border-top:1px solid {BORD};'
    rows+=f'''<div style="display:flex;align-items:center;gap:13px;padding:11px 0;{top}">
      <div style="width:38px;height:38px;border-radius:12px;background:{NAVBG};display:flex;align-items:center;justify-content:center">{svg(ic,19,SEC)}</div>
      <div style="flex:1;font-size:15px;font-weight:700;color:{INK}">{lab}</div>
      <div style="font-size:12px;font-weight:600;color:{MUT}">Read-only</div>
    </div>'''
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:12px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:27px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.intro{{font-size:14px;font-weight:500;line-height:1.5;color:{SEC};margin-bottom:16px}}
.statc{{background:{MINT[0]};border-radius:22px;padding:16px;margin-bottom:14px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.stath{{display:flex;align-items:center;gap:8px}}
.statt{{font-size:16px;font-weight:700;color:{MINT[1]}}}
.statb{{font-size:12px;font-weight:600;color:{MINT[1]};opacity:.9;line-height:1.5;margin-top:4px}}
.card{{background:#FFFBF4;border:1px solid {BORD};border-radius:22px;padding:16px;margin-bottom:14px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.lbl{{font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT};margin-bottom:6px}}
.btn{{background:{GRN};color:#fff;border-radius:99px;padding:15px;text-align:center;font-size:16px;font-weight:700}}
.foot{{text-align:center;font-size:12px;font-weight:600;color:{MUT};margin-top:12px;line-height:1.5}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Health Connect</div></div>
  <div class="intro">Health Connect is Android&rsquo;s shared health store. Linking it lets Nabdh read the data your other apps and watch already record — in one place, on your terms.</div>
  <div class="statc">
    <div class="stath">{svg('activity',18,MINT[1])}<span class="statt">Ready to connect</span></div>
    <div class="statb">Link Health Connect to pull steps, heart rate, sleep and more into Nabdh.</div>
  </div>
  <div class="card"><div class="lbl">NABDH WILL READ</div>{rows}</div>
  <div class="btn">Connect Health Connect</div>
  <div class="foot">Nabdh only reads — it never writes to or shares your Health Connect data.</div>
</div>
</body></html>'''
open('screen-hc.html','w').write(html)
print('ok')
