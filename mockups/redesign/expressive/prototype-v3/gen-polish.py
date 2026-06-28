import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVON='#211E1A';NAVTX='#FFF8EC'
AR='قهوة الصباح ممتازة اليوم — معدل تقلب ضربات القلب مرتفع، يوم مناسب لتمرين قوي بعد العصر بإذن الله'
def bubble(label,lh,ls,badge):
    return f'''<div style="background:#211E1A;border-radius:20px;padding:16px;margin-bottom:14px">
      <div style="display:inline-block;font-size:10px;letter-spacing:1px;font-weight:800;padding:4px 10px;border-radius:99px;background:{badge[0]};color:{badge[1]};margin-bottom:8px">{label}</div>
      <div style="font-family:Tajawal;font-weight:500;font-size:15px;color:#FFF8EC;line-height:{lh};letter-spacing:{ls}px" dir="rtl">{AR}</div>
    </div>'''
# glass cohesion phone: header glass buttons, prayer glass strip, tab bar + glossy FAB over color
T={'pink':'#F8DCE4','mint':'#D8EFE2','peach':'#F7E3C2','gold':'#FBE5BE','blue':'#D6EBF6','lav':'#DDD6F6'}
gbtn=lambda i:f'<div style="width:38px;height:38px;border-radius:14px;background:rgba(255,251,244,.4);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center">{svg(i,19,INK)}</div>'
PR=[('FAJR','4:12'),('DHUHR','11:54'),('ASR','3:18'),('MAGHRIB','6:42'),('ISHA','8:12')]
def prayer():
    c=''
    for n,t in PR:
        on=n=='ASR';bg=f'background:{GRN};' if on else '';nc='#fff' if on else SEC;tc='#fff' if on else INK
        c+=f'<div style="flex:1;text-align:center;padding:7px 0;border-radius:10px;{bg}"><div style="font-size:9px;font-weight:700;color:{nc}">{n}</div><div style="font-size:11.5px;font-weight:700;color:{tc};margin-top:3px">{t}</div></div>'
    return f'<div style="display:flex;gap:6px;padding:8px;border-radius:18px;background:rgba(255,251,244,.5);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.6);box-shadow:0 6px 16px rgba(58,46,26,.1)">{c}</div>'
def navbar():
    tabs=['Today','Sleep','Food','Coach']
    cells=''
    for i,t in enumerate(tabs):
        on=i==0;bg=f'background:{NAVON};' if on else '';col=NAVTX if on else SEC
        cells+=f'<div style="flex:1;text-align:center;padding:12px 0;border-radius:999px;{bg}"><span style="font-size:12.5px;font-weight:700;color:{col}">{t}</span></div>'
    fab=f'''<div style="width:56px;height:56px;border-radius:22px;background:{GRN};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.22);box-shadow:0 8px 18px rgba(46,125,91,.35)">
      <div style="position:absolute;top:0;left:0;right:0;height:26px;background:rgba(255,255,255,.14)"></div>{svg('plus',26,'#fff',2.4)}</div>'''
    return f'''<div style="display:flex;align-items:center;gap:10px">
      <div style="flex:1;display:flex;border-radius:999px;padding:6px;background:rgba(255,251,244,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.6);box-shadow:0 6px 16px rgba(58,46,26,.12)">{cells}</div>{fab}</div>'''
def tiles():
    cs=['mint','peach','blue','lav']
    cells=''.join('<div style="height:80px;border-radius:18px;background:'+T[c]+'"></div>' for c in cs)
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+cells+'</div>'
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
@font-face{{font-family:'Tajawal';src:url('fonts/Tajawal-Medium.ttf') format('truetype');font-weight:500}}
@font-face{{font-family:'Tajawal';src:url('fonts/Tajawal-Bold.ttf') format('truetype');font-weight:700}}
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;gap:24px;padding:30px}}
.phone{{width:380px;background:#F7F1E8;border-radius:36px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.tag{{display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;padding:5px 12px;border-radius:99px;margin-bottom:14px}}
</style></head><body>
<div class="phone">
  <div class="tag" style="background:#DDD6F6;color:#4A4080">ARABIC LINE-HEIGHT</div>
  {bubble('BEFORE',1.0,-0.4,('#F7E3C2','#6B5328'))}
  {bubble('AFTER',1.18,0,('#D8EFE2','#1E5A40'))}
</div>
<div class="phone">
  <div class="tag" style="background:#D8EFE2;color:#1E5A40">GLASS COHESION</div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <div style="font-size:19px;font-weight:800;color:{INK}">Nabdh<span style="color:{GRN}">.</span></div>
    <div style="display:flex;gap:9px">{gbtn('moon-star')}{gbtn('moon')}<div style="width:38px;height:38px;border-radius:14px;background:{T['peach']};display:flex;align-items:center;justify-content:center;font-size:13.5px;font-weight:800;color:#6B5328">A</div></div>
  </div>
  {tiles()}
  <div style="margin:16px 0">{prayer()}</div>
  {navbar()}
</div>
</body></html>'''
open('screen-polish.html','w').write(html)
print('ok')
