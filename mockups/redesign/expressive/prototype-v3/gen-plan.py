import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';GRNT='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA';NAVON='#211E1A';NAVTX='#FFF8EC'
MINT=('#D8EFE2','#1E5A40');PEACH=('#F7E3C2','#6B5328')
# (time, kind, label, sub, icon, highlight)  prayer|block
items=[
 ('4:12 AM','prayer','Fajr','','sunrise',False),
 ('4:57 AM','block','Light breakfast','Protein and a couple of dates to start','utensils',False),
 ('11:54 AM','prayer','Dhuhr','','sun',False),
 ('12:34 PM','block','Lunch','Your bigger meal while it’s hot outside','utensils',False),
 ('3:18 PM','prayer','Asr','','sun-medium',False),
 ('5:00 PM','block','Main workout','Post-Asr — the coolest training window','dumbbell',True),
 ('6:42 PM','prayer','Maghrib','','sunset',False),
 ('7:12 PM','block','Dinner','Refuel after the day’s effort','utensils',False),
 ('8:12 PM','prayer','Isha','','moon-star',False),
]
NOW='5:00 PM'  # pretend now ~ workout
rows=''
for i,(t,kind,label,sub,icon,hl) in enumerate(items):
    last = i==len(items)-1
    prayer = kind=='prayer'
    ibg = GRN if hl else (NAVON if prayer else PEACH[0])
    ic = '#fff' if hl else (NAVTX if prayer else PEACH[1])
    now = t==NOW
    tcol = GRN if now else MUT
    tw = '800' if now else '600'
    rail = '' if last else f'<div style="width:2px;flex:1;background:{BORD};margin-top:2px"></div>'
    if hl:
        content=f'<div style="background:{MINT[0]};border-radius:14px;padding:12px;margin-top:-2px"><div style="font-size:15px;font-weight:700;color:{MINT[1]}">{label}</div><div style="font-size:12px;font-weight:600;color:{MINT[1]};opacity:.9;margin-top:1px">{sub}</div></div>'
    elif prayer:
        content=f'<div style="padding-top:7px"><div style="display:flex;align-items:center;gap:6px"><span style="font-size:15px;font-weight:700;color:{INK}">{label}</span><span style="font-size:11px;letter-spacing:1px;font-weight:600;color:{MUT}">PRAYER</span></div></div>'
    else:
        content=f'<div style="padding-top:7px"><div style="font-size:15px;font-weight:700;color:{INK}">{label}</div><div style="font-size:12px;font-weight:600;color:{MUT};margin-top:1px">{sub}</div></div>'
    rows+=f'''<div style="display:flex;gap:13px;padding-bottom:{0 if last else 18}px">
      <div style="width:64px;text-align:right;padding-top:6px;font-size:12px;font-weight:{tw};color:{tcol};font-variant-numeric:tabular-nums">{t}</div>
      <div style="display:flex;flex-direction:column;align-items:center;width:40px">
        <div style="width:40px;height:40px;border-radius:13px;background:{ibg};display:flex;align-items:center;justify-content:center">{svg(icon,20,ic)}</div>{rail}
      </div>
      <div style="flex:1">{content}</div>
    </div>'''
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:12px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:27px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.intro{{font-size:14px;font-weight:500;line-height:1.5;color:{SEC};margin-bottom:16px}}
.card{{background:#FFFBF4;border:1px solid {BORD};border-radius:22px;padding:18px 16px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.foot{{text-align:center;font-size:12px;font-weight:600;color:{MUT};margin-top:14px;line-height:1.5}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Your day</div></div>
  <div class="intro">Meals and training laid out around today’s prayers — with your main session parked in the cool post-Asr window.</div>
  <div class="card">{rows}</div>
  <div class="foot">Prayer times are demo values for Riyadh. Blocks are suggestions you can shift around your day.</div>
</div>
</body></html>'''
open('screen-plan.html','w').write(html)
print('ok')
