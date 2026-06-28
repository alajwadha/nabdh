import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
LAV=('#DDD6F6','#4A4080');PEACH=('#F7E3C2','#6B5328');GOLD=('#FBE5BE','#8A6312');BLUE=('#D6EBF6','#2C5C77');MINT=('#D8EFE2','#1E5A40')
T={'peach':PEACH,'mint':MINT,'gold':GOLD,'blue':BLUE,'pink':('#F8DCE4','#7A3A52'),'lav':LAV}
def dishrow(name,ar,serv,kcal,col):
    bg,ink=T[col]
    return f'''<div style="display:flex;align-items:center;gap:13px;padding:9px 0">
      <div style="width:34px;height:34px;border-radius:11px;background:{bg};display:flex;align-items:center;justify-content:center">{svg('utensils',16,ink)}</div>
      <div style="flex:1"><div style="display:flex;gap:7px;align-items:baseline"><span style="font-size:14.5px;font-weight:700;color:{INK}">{name}</span><span style="font-size:12px;font-weight:600;color:{MUT}">{ar}</span></div><div style="font-size:12px;font-weight:600;color:{MUT}">{serv} · {kcal} kcal</div></div>
      {svg('plus',17,GRN)}</div>'''
def pace(icon,label,n,last):
    top='' if last else f'border-top:1px solid {BORD};'
    return f'''<div style="display:flex;align-items:center;gap:13px;padding:9px 0;{top}">{svg(icon,17,SEC)}<span style="flex:1;font-size:14.5px;font-weight:700;color:{INK}">{label}</span><span style="font-size:16px;font-weight:800;color:{BLUE[1]};font-variant-numeric:tabular-nums">{n}</span><span style="font-size:12px;font-weight:600;color:{MUT}">glasses</span></div>'''
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:14px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:27px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.card{{background:#FFFBF4;border:1px solid {BORD};border-radius:22px;padding:16px;margin-bottom:14px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.ch{{display:flex;align-items:center;gap:8px;margin-bottom:8px}}
.ct{{font-size:16px;font-weight:700;color:{INK};flex:1}}
.cap{{font-size:12px;font-weight:600;color:{SEC};line-height:1.5}}
.foot{{text-align:center;font-size:12px;font-weight:600;color:{MUT};margin-top:4px;line-height:1.5}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Ramadan</div></div>
  <div class="card" style="background:{LAV[0]};border-color:{LAV[0]};display:flex;align-items:center;gap:13px">
    <div style="width:46px;height:46px;border-radius:15px;background:#FFFBF4;display:flex;align-items:center;justify-content:center">{svg('moon-star',22,LAV[1])}</div>
    <div style="flex:1"><div style="font-size:11px;letter-spacing:1.2px;font-weight:700;color:{LAV[1]};opacity:.8">FASTING · IFTAR IN</div>
    <div style="font-size:30px;font-weight:800;letter-spacing:-1px;color:{LAV[1]};font-variant-numeric:tabular-nums;line-height:1.1">3:41:08</div>
    <div style="font-size:12px;font-weight:600;color:{LAV[1]};opacity:.9">Maghrib at 6:42 PM</div></div>
  </div>
  <div class="card">
    <div class="ch">{svg('sunset',18,PEACH[1])}<span class="ct">Iftar · 6:42 PM</span></div>
    <div class="cap">Break with 2–3 dates and water, pray Maghrib, then a balanced plate — protein, vegetables and slow carbs.</div>
    <div style="margin-top:2px">{dishrow('Dates','تمر','3 dates',200,'peach')}{dishrow('Laban / ayran','لبن','1 cup',90,'blue')}{dishrow('Harees','هريس','1 bowl',310,'mint')}</div>
  </div>
  <div class="card">
    <div class="ch">{svg('sunrise',18,GOLD[1])}<span class="ct">Suhoor · before 4:12 AM</span></div>
    <div class="cap">Slow-release carbs + protein (foul, eggs, laban) and plenty of water to carry you through the fast.</div>
    <div style="margin-top:2px">{dishrow('Foul medames','فول مدمس','1 bowl',220,'mint')}{dishrow('Tameez bread','تميس','1 piece',280,'peach')}</div>
  </div>
  <div class="card">
    <div class="ch">{svg('droplets',18,BLUE[1])}<span class="ct">Hydration catch-up</span><span style="font-size:18px;font-weight:800;color:{BLUE[1]};font-variant-numeric:tabular-nums">10</span><span style="font-size:12px;font-weight:600;color:{MUT}">glasses</span></div>
    <div class="cap" style="margin-bottom:4px">None of it can happen during the fast, so pace your water across the evening:</div>
    {pace('sunset','At iftar',3,False)}{pace('moon-star','Through the evening',5,False)}{pace('sunrise','At suhoor',2,True)}
  </div>
  <div class="foot">Prayer times are demo values for Riyadh. Guidance is general — adjust to how you feel.</div>
</div>
</body></html>'''
open('screen-ram.html','w').write(html)
print('ok')
