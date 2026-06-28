import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA';NAVON='#211E1A';NAVTX='#FFF8EC'
T={'pink':('#F8DCE4','#7A3A52'),'mint':('#D8EFE2','#1E5A40'),'peach':('#F7E3C2','#6B5328'),'gold':('#FBE5BE','#8A6312'),'blue':('#D6EBF6','#2C5C77')}
dishes=[('Kabsa with chicken','كبسة دجاج','1 plate','38','62','24','640','pink'),
 ('Lamb mandi','مندي لحم','1 plate','42','58','32','700','pink'),
 ('Foul medames','فول مدمس','1 bowl','12','30','6','220','mint'),
 ('Dates','تمر','3 dates','2','50','0','200','peach'),
 ('Arabic coffee','قهوة عربية','1 cup','0','1','0','5','gold'),
 ('Harees','هريس','1 bowl','18','38','9','310','mint')]
rows=''
for name,ar,serv,p,c,f,kcal,col in dishes:
    bg,ink=T[col]
    rows+=f'''<div style="display:flex;align-items:center;gap:13px;background:#FFFBF4;border:1px solid {BORD};border-radius:18px;padding:12px;margin-bottom:8px">
      <div style="width:44px;height:44px;border-radius:13px;background:{bg};display:flex;align-items:center;justify-content:center">{svg('utensils',19,ink)}</div>
      <div style="flex:1"><div style="font-size:15px;font-weight:700;color:{INK}">{name}</div><div style="font-size:12px;font-weight:600;color:{MUT}">{ar} · {serv} · P{p} C{c} F{f}</div></div>
      <div style="text-align:right"><div style="font-size:17px;font-weight:800;color:{INK};font-variant-numeric:tabular-nums">{kcal}</div><div style="font-size:12px;font-weight:600;color:{MUT}">kcal</div></div>
      {svg('plus',18,GRN)}</div>'''
def actbtn(icon,label):
    return f'<div style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;background:{NAVBG};border-radius:14px;padding:13px"><div>{svg(icon,18,INK)}</div><span style="font-size:13px;font-weight:700;color:{INK}">{label}</span></div>'
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:14px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:27px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.searchbox{{display:flex;align-items:center;gap:9px;background:#FFFBF4;border:1px solid {BORD};border-radius:16px;padding:0 14px;height:50px;margin-bottom:12px}}
.lbl{{font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT};margin:8px 0 8px 2px}}
.foot{{text-align:center;font-size:12px;font-weight:600;color:{MUT};margin-top:6px}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Add food</div></div>
  <div class="searchbox">{svg('search',18,MUT)}<span style="flex:1;font-size:15px;font-weight:500;color:{INK}">kabsa</span>{svg('x',16,MUT)}</div>
  <div style="display:flex;gap:8px;margin-bottom:8px">{actbtn('scan-barcode','Scan barcode')}{actbtn('camera','Snap a meal')}</div>
  <div class="lbl">GULF DISHES</div>
  {rows}
  <div class="foot">Macros are typical per-serving estimates for a home portion.</div>
</div>
</body></html>'''
open('screen-fs.html','w').write(html)
print('ok')
