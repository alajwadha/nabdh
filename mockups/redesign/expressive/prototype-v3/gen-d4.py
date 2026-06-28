import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA';NAVON='#211E1A';NAVTX='#FFF8EC'
T={'mint':('#D8EFE2','#1E5A40'),'blue':('#D6EBF6','#2C5C77'),'peach':('#F7E3C2','#6B5328'),'lav':('#DDD6F6','#4A4080')}

def header(after):
    if after:
        btns=f'<div class="hb">{svg("moon-star",18,INK)}</div><div class="hb">{svg("moon",18,INK)}</div>'
    else:
        btns='<div class="hb" style="font-size:15px">☪</div><div class="hb" style="font-size:15px">🌙</div>'
    return f'<div class="hd"><div class="logo">Nabdh<span style="color:{GRN}">.</span></div><div class="hgrp">{btns}<div class="hb" style="background:#F7E3C2;color:#6B5328;font-weight:800;font-size:13px">A</div></div></div>'

def qrow(icon_after, emoji, tint, title, sub, after):
    bg,ink=T[tint]
    art = svg(icon_after,20,INK) if after else f'<span style="font-size:19px">{emoji}</span>'
    return f'''<div class="qr"><div class="qi" style="background:{bg}">{art}</div><div style="flex:1"><div class="qt">{title}</div><div class="qs">{sub}</div></div></div>'''

def prog(icon_after, emoji, tint, name, n, after):
    bg,ink=T[tint]
    art = svg(icon_after,22,ink) if after else f'<span style="font-size:22px">{emoji}</span>'
    return f'''<div class="pc"><div class="pi" style="background:{bg}">{art}</div><div style="flex:1"><div class="qt">{name}</div><div class="qs">{n} exercises</div></div><div style="font-size:12px;font-weight:700;color:{GRN}">Start ›</div></div>'''

def phone(after,label):
    q=(qrow('utensils','📷','mint','Snap a meal','Photo → instant macros',after)+
       qrow('dumbbell','🏋️','lav','Start a workout','Log gym or a sport',after)+
       qrow('droplet','💧','blue','Add water','+250 ml',after))
    p=(prog('rotate-cw','🔁','mint','Full body',6,after)+
       prog('chevron-up','⬆️','blue','Push day',5,after)+
       prog('footprints','🦵','peach','Leg day',6,after))
    badge_bg = '#D8EFE2' if after else '#F7E3C2'
    badge_tx = '#1E5A40' if after else '#6B5328'
    return f'''<div class="phone">
      <div class="tag" style="background:{badge_bg};color:{badge_tx}">{label}</div>
      {header(after)}
      <div class="sec">QUICK ACTIONS</div>{q}
      <div class="sec">PROGRAMS</div>{p}
    </div>'''

html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;gap:24px;padding:28px}}
.phone{{width:360px;background:#F7F1E8;border-radius:34px;padding:20px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.tag{{display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;padding:5px 12px;border-radius:99px;margin-bottom:14px}}
.hd{{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}}
.logo{{font-size:19px;font-weight:800;color:{INK}}}
.hgrp{{display:flex;gap:9px;align-items:center}}
.hb{{width:38px;height:38px;border-radius:13px;background:{NAVBG};display:flex;align-items:center;justify-content:center;color:{INK}}}
.sec{{font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT};margin:18px 0 8px 2px}}
.qr{{display:flex;align-items:center;gap:13px;padding:11px 0;border-bottom:1px solid {BORD}}}
.qi{{width:44px;height:44px;border-radius:15px;display:flex;align-items:center;justify-content:center}}
.qt{{font-size:15px;font-weight:700;color:{INK}}} .qs{{font-size:12px;font-weight:500;color:{MUT}}}
.pc{{display:flex;align-items:center;gap:13px;background:#FFFBF4;border:1px solid {BORD};border-radius:18px;padding:13px;margin-bottom:9px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.pi{{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center}}
</style></head><body>
{phone(False,'BEFORE')}
{phone(True,'AFTER — LINE ICONS')}
</body></html>'''
open('screen-d4.html','w').write(html)
print('ok')
