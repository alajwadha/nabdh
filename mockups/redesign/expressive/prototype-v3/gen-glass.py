import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';GRN='#2E7D5B';NAVON='#211E1A';NAVTX='#FFF8EC'
T={'pink':'#F8DCE4','mint':'#D8EFE2','peach':'#F7E3C2','gold':'#FBE5BE','blue':'#D6EBF6','lav':'#DDD6F6'}
# colorful content behind (tiles)
def tiles():
    cs=['mint','peach','blue','lav','pink','gold']
    out=''
    for i,c in enumerate(cs):
        out+=f'<div style="height:96px;border-radius:20px;background:{T[c]}"></div>'
    return f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:18px">{out}</div>'
def navpill(active):
    tabs=['Today','Sleep','Food','Coach']
    cells=''
    for i,t in enumerate(tabs):
        on=i==active
        bg=f'background:{NAVON};' if on else ''
        col=NAVTX if on else MUT
        cells+=f'<div style="flex:1;text-align:center;padding:12px 0;border-radius:999px;{bg}"><span style="font-size:12.5px;font-weight:700;color:{col}">{t}</span></div>'
    return f'''<div style="display:flex;align-items:center;gap:10px;padding:10px 20px 26px">
      <div style="flex:1;display:flex;border-radius:999px;padding:6px;background:rgba(255,251,244,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.6);box-shadow:0 6px 16px rgba(58,46,26,.12)">{cells}</div>
      <div style="width:56px;height:56px;border-radius:22px;background:{GRN};display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(46,125,91,.35)">{svg('plus',26,'#fff',2.4)}</div>
    </div>'''
def quickrow(icon,bg,title,sub):
    return f'''<div style="display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:2px solid rgba(160,150,130,.18)">
      <div style="width:44px;height:44px;border-radius:15px;background:{bg};display:flex;align-items:center;justify-content:center">{svg(icon,20,INK)}</div>
      <div style="flex:1"><div style="font-size:16px;font-weight:700;color:{INK}">{title}</div><div style="font-size:12px;font-weight:500;color:{MUT}">{sub}</div></div></div>'''
sheet=f'''<div style="position:absolute;left:0;right:0;bottom:0;top:0;background:rgba(15,12,8,.45)"></div>
<div style="position:absolute;left:0;right:0;bottom:0;border-top-left-radius:32px;border-top-right-radius:32px;background:rgba(255,251,244,.5);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border-top:1.5px solid rgba(255,255,255,.6);padding:14px 24px 30px;box-shadow:0 -10px 40px rgba(20,16,10,.18)">
  <div style="width:44px;height:5px;border-radius:99px;background:rgba(160,150,130,.4);margin:0 auto 16px"></div>
  {quickrow('utensils',T['mint'],'Snap a meal','Photo → instant macros')}
  {quickrow('dumbbell',T['lav'],'Start a workout','Log gym or a sport')}
  {quickrow('droplet',T['blue'],'Add water','+250 ml')}
  <div style="border-bottom:none">{quickrow('message-circle',T['peach'],'Ask the coach','Today’s plan')}</div>
</div>'''
def phone(inner,label,badge):
    return f'''<div style="position:relative;width:360px;height:720px;background:#F7F1E8;border-radius:40px;overflow:hidden;box-shadow:0 30px 90px rgba(20,16,10,.22)">
      <div style="position:absolute;top:16px;left:16px;z-index:5;font-size:11px;font-weight:800;letter-spacing:1px;padding:5px 12px;border-radius:99px;background:{badge[0]};color:{badge[1]}">{label}</div>
      {inner}</div>'''
left=f'<div style="padding-top:44px">{tiles()}</div><div style="position:absolute;left:0;right:0;bottom:0">{navpill(2)}</div>'
right=f'<div style="padding-top:44px">{tiles()}</div>{sheet}'
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;gap:26px;padding:30px}}
</style></head><body>
{phone(left,'GLASS TAB BAR',('#D8EFE2','#1E5A40'))}
{phone(right,'FROSTED SHEET',('#DDD6F6','#4A4080'))}
</body></html>'''
open('screen-glass.html','w').write(html)
print('ok')
