import json
ICONS = json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
TILES={'mint':('#D8EFE2','#1E5A40'),'blue':('#D6EBF6','#2C5C77'),'peach':('#F7E3C2','#6B5328'),
       'lav':('#DDD6F6','#4A4080'),'gold':('#FBE5BE','#8A6312'),'pink':('#F8DCE4','#7A3A52')}
# (label, icon, tint, count)
items=[('Workouts','dumbbell','mint',24),('Weight','scale','mint',12),('Blood pressure','heart-pulse','pink',9),
       ('Glucose','droplet','blue',7),('Medications','pill','gold',3),('Breathing','wind','lav',5),('Cycle','calendar','pink',0)]
def chk(on,empty):
    if on and not empty:
        return f'<div style="width:28px;height:28px;border-radius:9px;background:{GRN};display:flex;align-items:center;justify-content:center">{svg("check",16,"#fff")}</div>'
    return f'<div style="width:28px;height:28px;border-radius:9px;border:2px solid {BORD}"></div>'
rows=''
for i,(lab,ic,tint,n) in enumerate(items):
    empty=n==0; on=not empty
    bg,ink=TILES[tint]
    op='opacity:.45;' if empty else ''
    top='' if i==0 else f'border-top:1px solid {BORD};'
    sub='No records yet' if empty else f'{n} records'
    rows+=f'''<div style="display:flex;align-items:center;gap:12px;padding:11px 0;{top}{op}">
      <div style="width:38px;height:38px;border-radius:12px;background:{bg};display:flex;align-items:center;justify-content:center">{svg(ic,19,ink)}</div>
      <div style="flex:1"><div style="font-size:15px;font-weight:700;color:{INK}">{lab}</div><div style="font-size:12px;font-weight:600;color:{MUT};margin-top:1px">{sub}</div></div>
      {chk(on,empty)}</div>'''
total=sum(n for _,_,_,n in items if n>0)
types=sum(1 for _,_,_,n in items if n>0)
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:12px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:28px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.intro{{font-size:14px;font-weight:500;line-height:1.5;color:{SEC};margin-bottom:16px}}
.seg{{position:relative;display:flex;background:{NAVBG};border-radius:99px;padding:4px;margin-bottom:16px}}
.seg .ind{{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px)/2);border-radius:99px;background:#FFFBF4}}
.seg .s{{flex:1;text-align:center;padding:9px 0;font-size:12.5px;font-weight:700;z-index:1}}
.seg .on{{color:{INK}}} .seg .off{{color:{MUT}}}
.card{{background:#FFFBF4;border:1px solid {BORD};border-radius:22px;padding:16px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.lbl{{font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT};margin-bottom:6px}}
.sum{{display:flex;align-items:center;justify-content:space-between;padding:14px 4px 0;font-size:12px;font-weight:600;color:{MUT}}}
.btn{{background:{GRN};color:#fff;border-radius:99px;padding:15px;text-align:center;font-size:16px;font-weight:700;margin-top:14px}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Export data</div></div>
  <div class="intro">Take your data with you. Pick what to include and a format, and Nabdh builds a single file you can save or send. Nothing leaves your phone until you share it.</div>
  <div class="seg"><div class="ind"></div><div class="s on">JSON</div><div class="s off">CSV</div></div>
  <div class="card"><div class="lbl">INCLUDE</div>{rows}</div>
  <div class="sum"><span>{total} records across {types} types</span><span>~14 KB · JSON</span></div>
  <div class="btn" style="display:flex;align-items:center;justify-content:center;gap:8px">{svg('download',18,'#fff')}<span>Export &amp; share</span></div>
</div>
</body></html>'''
open('screen-export.html','w').write(html)
print('ok')
