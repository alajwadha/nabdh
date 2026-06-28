import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
T={'pink':'#F8DCE4','mint':'#D8EFE2','peach':'#F7E3C2','gold':'#FBE5BE','blue':'#D6EBF6','lav':'#DDD6F6'}
glassbtn=lambda icon:f'<div style="width:38px;height:38px;border-radius:14px;background:rgba(255,251,244,.4);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center">{svg(icon,19,INK)}</div>'
PR=[('FAJR','4:12'),('DHUHR','11:54'),('ASR','3:18'),('MAGHRIB','6:42'),('ISHA','8:12')]
def prayer():
    cells=''
    for i,(n,t) in enumerate(PR):
        on=n=='ASR'
        bg=f'background:{GRN};' if on else ''
        nc='#fff' if on else SEC; tc='#fff' if on else INK
        cells+=f'<div style="flex:1;text-align:center;padding:7px 0;border-radius:10px;{bg}"><div style="font-size:9px;letter-spacing:.6px;font-weight:700;color:{nc}">{n}</div><div style="font-size:11.5px;font-weight:700;color:{tc};margin-top:3px">{t}</div></div>'
    return f'<div style="display:flex;gap:6px;padding:8px;border-radius:18px;background:rgba(255,251,244,.5);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.6);box-shadow:0 6px 16px rgba(58,46,26,.1)">{cells}</div>'
def tile(c,lbl,val,unit):
    return f'<div style="background:{T[c]};border-radius:20px;padding:14px;height:96px"><div style="font-size:11px;font-weight:700;color:{INK};opacity:.7">{lbl}</div><div style="font-size:30px;font-weight:800;color:{INK};letter-spacing:-1px;margin-top:8px;font-variant-numeric:tabular-nums">{val}<span style="font-size:13px;font-weight:600;opacity:.6"> {unit}</span></div></div>'
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:30px}}
.phone{{width:392px;background:#F7F1E8;border-radius:38px;padding:20px 20px 0}}
.box{{box-shadow:0 30px 90px rgba(20,16,10,.22);border-radius:38px}}
</style></head><body>
<div class="phone box">
  <div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px">
    <div style="font-size:19px;font-weight:800;color:{INK}">Nabdh<span style="color:{GRN}">.</span></div>
    <div style="display:flex;gap:9px">{glassbtn('moon-star')}{glassbtn('moon')}<div style="width:38px;height:38px;border-radius:14px;background:{T['peach']};display:flex;align-items:center;justify-content:center;font-size:13.5px;font-weight:800;color:#6B5328">A</div></div>
  </div>
  <div style="font-size:32px;font-weight:800;letter-spacing:-.8px;color:{INK};margin-top:14px">Good morning, <span style="color:{GRN}">Ali</span></div>
  <!-- colorful insight hero (stays vibrant) -->
  <div style="background:#4A3F9E;border-radius:24px;padding:18px;margin-top:16px;color:#fff">
    <div style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.2);border-radius:99px;padding:5px 10px;font-size:10px;letter-spacing:1px;font-weight:700">{svg('zap',11,'#fff')} READINESS</div>
    <div style="font-size:40px;font-weight:800;letter-spacing:-1px;margin-top:8px;font-variant-numeric:tabular-nums">72</div>
    <div style="font-size:13px;font-weight:500;opacity:.92;line-height:1.5">Solid recovery — a good day to push. HRV trending up.</div>
  </div>
  <!-- glass prayer strip near the colorful hero -->
  <div style="margin-top:14px">{prayer()}</div>
  <div style="font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT};margin:18px 0 10px 2px">YOUR METRICS</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-bottom:20px">
    {tile('mint','RESTING HR','54','bpm')}{tile('blue','SLEEP','7.4','h')}
  </div>
</div>
</body></html>'''
open('screen-home-glass.html','w').write(html)
print('ok')
