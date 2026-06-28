import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
MINT=('#D8EFE2','#1E5A40');BLUE=('#D6EBF6','#2C5C77')
LVL='#BC5A24' # high
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:14px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:26px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.card{{background:#FFFBF4;border:1px solid {BORD};border-radius:22px;padding:16px;margin-bottom:14px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.cur{{display:flex;flex-direction:column;align-items:center;padding:22px 16px}}
.kick{{display:flex;align-items:center;gap:8px}}
.klbl{{font-size:11px;letter-spacing:1.2px;font-weight:700;color:{MUT}}}
.big{{font-size:60px;font-weight:800;letter-spacing:-2px;line-height:1;color:{INK};font-variant-numeric:tabular-nums}}
.seclbl{{font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT}}}
.row{{display:flex;align-items:center;justify-content:space-between}}
.tint{{display:flex;align-items:center;gap:13px}}
.ic{{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center}}
.foot{{text-align:center;font-size:12px;font-weight:600;color:{MUT};margin-top:4px;line-height:1.5}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Heat &amp; training</div></div>
  <div class="card cur">
    <div class="kick">{svg('sun-medium',18,LVL)}<span class="klbl">RIYADH · FEELS LIKE</span></div>
    <div class="big">44&deg;</div>
    <div class="klbl" style="color:{MUT};font-weight:600;letter-spacing:0">Air 41&deg; · 14% humidity</div>
  </div>
  <div class="card">
    <div class="row"><span class="seclbl">HEAT RISK</span><div style="display:flex;align-items:center;gap:6px"><div style="width:9px;height:9px;border-radius:5px;background:{LVL}"></div><span style="font-size:15px;font-weight:700;color:{INK}">High</span></div></div>
    <div style="font-size:12px;font-weight:600;color:{SEC};line-height:1.5;margin-top:8px">Keep outdoor sessions short and easy, and only in the cooler windows.</div>
  </div>
  <div class="card" style="background:{MINT[0]};border-color:{MINT[0]}">
    <div class="tint"><div class="ic" style="background:#FFFBF4">{svg('wind',22,MINT[1])}</div>
    <div style="flex:1"><div style="font-size:11px;letter-spacing:1.2px;font-weight:700;color:{MINT[1]};opacity:.8">BEST WINDOW TO TRAIN OUTSIDE</div>
    <div style="font-size:16px;font-weight:700;color:{MINT[1]}">7 PM – 9 PM · feels 33&deg;</div>
    <div style="font-size:12px;font-weight:600;color:{MINT[1]};opacity:.9">After Asr, as it cools off.</div></div></div>
  </div>
  <div class="card">
    <div class="tint"><div class="ic" style="background:{BLUE[0]}">{svg('droplets',22,BLUE[1])}</div>
    <div style="flex:1"><div style="font-size:16px;font-weight:700;color:{INK}">Add ~3 glasses</div>
    <div style="font-size:12px;font-weight:600;color:{MUT}">Extra water around a 45-min outdoor session in this heat.</div></div></div>
  </div>
  <div class="foot">Live weather · Riyadh. Hydration is an estimate from your body weight and effort.</div>
</div>
</body></html>'''
open('screen-heat.html','w').write(html)
print('ok')
