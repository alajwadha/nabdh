import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
ZON=[('Recovery','#3E7B9C'),('Easy','#2F8158'),('Aerobic','#8C6C18'),('Threshold','#BC5A24'),('Max','#B03A2A')]
maxhr=190
ranges=[(95,114),(114,133),(133,152),(152,171),(171,190)]
secs=[190,520,570,320,80]  # seconds per zone
total=sum(secs)
def mmss(s): return f'{s//60}:{s%60:02d}'
cur=148; curzi=2; curpct=round(cur/maxhr*100)
# stacked bar
barW=300
segs=''; x=0
for i,(nm,col) in enumerate(ZON):
    w=secs[i]/total*barW
    segs+=f'<rect x="{x:.1f}" y="0" width="{w:.1f}" height="16" fill="{col}"/>'; x+=w
bar=f'<svg width="{barW}" height="16">{segs}</svg>'
# rows
rows=''
for i,(nm,col) in enumerate(ZON):
    lo,hi=ranges[i]; p=round(secs[i]/total*100); here=i==curzi
    dot=f'<div style="width:6px;height:6px;border-radius:3px;background:{col}"></div>' if here else ''
    fillw=max(3,p)
    rows+=f'''<div style="display:flex;align-items:center;gap:12px;padding:10px 0;{'border-top:1px solid '+BORD+';' if i>0 else ''}">
      <div style="width:30px;height:30px;border-radius:9px;background:{col};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px">{i+1}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:6px"><span style="font-size:14.5px;font-weight:700;color:{INK}">{nm}</span>{dot}</div>
        <div style="font-size:12px;font-weight:600;color:{MUT}">{lo}–{hi} bpm</div>
        <div style="height:4px;border-radius:99px;background:{NAVBG};margin-top:5px;overflow:hidden"><div style="width:{fillw}%;height:100%;background:{col}"></div></div>
      </div>
      <div style="text-align:right;min-width:56px"><div style="font-size:15px;font-weight:800;color:{INK};font-variant-numeric:tabular-nums">{mmss(secs[i])}</div><div style="font-size:12px;font-weight:600;color:{MUT}">{p}%</div></div>
    </div>'''
curcol=ZON[curzi][1]
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:14px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:27px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.card{{background:#FFFBF4;border:1px solid {BORD};border-radius:22px;padding:16px;margin-bottom:14px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.hero{{display:flex;flex-direction:column;align-items:center;padding:22px 16px}}
.kick{{display:flex;align-items:center;gap:8px}}
.lbl{{font-size:11px;letter-spacing:1.2px;font-weight:700;color:{MUT}}}
.big{{font-size:68px;font-weight:800;letter-spacing:-2px;line-height:1;color:#1F1C17;font-variant-numeric:tabular-nums}}
.sec{{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}}
.seclbl{{font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT}}}
.btn{{background:{GRN};color:#fff;border-radius:99px;padding:15px;text-align:center;font-size:16px;font-weight:700}}
.foot{{text-align:center;font-size:12px;font-weight:600;color:{MUT};margin-top:12px}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Heart-rate zones</div></div>
  <div class="card hero">
    <div class="kick">{svg('heart-pulse',20,curcol)}<span class="lbl">LIVE · SAMPLE</span></div>
    <div class="big">{cur}</div>
    <div class="lbl" style="margin-top:2px">BPM</div>
    <div style="display:flex;align-items:center;gap:7px;margin-top:8px"><div style="width:9px;height:9px;border-radius:5px;background:{curcol}"></div><span style="font-size:17px;font-weight:700;color:#1F1C17">Aerobic &middot; {curpct}% max</span></div>
  </div>
  <div class="card">
    <div class="sec"><span class="seclbl">TIME IN ZONE</span><span style="font-size:12px;font-weight:600;color:{MUT}">{mmss(total)} total</span></div>
    <div style="border-radius:8px;overflow:hidden;background:{NAVBG};width:100%">{bar}</div>
  </div>
  <div class="card">
    <div class="sec" style="margin-bottom:10px"><span class="seclbl">ZONES</span><span style="font-size:12px;font-weight:600;color:{GRN}">Max {maxhr} bpm · edit</span></div>
    {rows}
  </div>
  <div class="btn">Stop</div>
  <div class="foot">Simulated sample — pair a strap or watch for live readings.</div>
</div>
</body></html>'''
open('screen-hr.html','w').write(html)
print('ok')
