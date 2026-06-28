import json, math
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
MINT=('#D8EFE2','#1E5A40')
# ring: progress 0.62 fasting (green)
RING=248;STROKE=20;prog=0.62;color=GRN
r=(RING-STROKE)/2;cx=RING/2;cy=RING/2
def arc(p):
    # describe arc path from -90deg sweeping p*360
    start=-90;end=-90+p*360
    sx=cx+r*math.cos(math.radians(start));sy=cy+r*math.sin(math.radians(start))
    ex=cx+r*math.cos(math.radians(end));ey=cy+r*math.sin(math.radians(end))
    large=1 if p>0.5 else 0
    return f'M{sx:.1f},{sy:.1f} A{r},{r} 0 {large} 1 {ex:.1f},{ey:.1f}'
ring=f'''<svg width="{RING}" height="{RING}">
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{NAVBG}" stroke-width="{STROKE}"/>
  <path d="{arc(prog)}" fill="none" stroke="{color}" stroke-width="{STROKE}" stroke-linecap="round"/>
</svg>'''
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:14px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:27px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.ringwrap{{position:relative;height:{RING+8}px;display:flex;align-items:center;justify-content:center}}
.center{{position:absolute;text-align:center;display:flex;flex-direction:column;align-items:center}}
.kick{{display:flex;align-items:center;gap:6px}}
.klbl{{font-size:11px;letter-spacing:1.2px;font-weight:700;color:{MUT}}}
.big{{font-size:46px;font-weight:800;letter-spacing:-1.5px;line-height:1.1;color:{GRN};font-variant-numeric:tabular-nums}}
.sub{{font-size:12px;font-weight:600;color:{MUT};margin-top:2px}}
.card{{background:{MINT[0]};border-radius:22px;padding:16px;margin:14px 0;display:flex;align-items:center;gap:13px;box-shadow:0 6px 16px rgba(58,46,26,.08)}}
.ctitle{{font-size:16px;font-weight:700;color:{MINT[1]}}}
.csub{{font-size:12px;font-weight:600;color:{MINT[1]};opacity:.9;margin-top:1px}}
.line{{border:2px solid {BORD};color:{INK};border-radius:99px;padding:14px;text-align:center;font-size:15px;font-weight:700}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Fasting</div></div>
  <div class="ringwrap">{ring}
    <div class="center">
      <div class="kick">{svg('moon',16,GRN)}<span class="klbl">FASTING</span></div>
      <div class="big">9:54:12</div>
      <div class="sub">until your eating window</div>
    </div>
  </div>
  <div class="card">{svg('timer',20,MINT[1])}<div style="flex:1"><div class="ctitle">16:8 plan</div><div class="csub">Eat at 12:00 PM · 62% through</div></div></div>
  <div class="line">End fast</div>
</div>
</body></html>'''
open('screen-fast.html','w').write(html)
print('ok')
