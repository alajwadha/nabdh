import json, math, random
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA';NAVON='#211E1A';NAVTX='#FFF8EC'

# build a plausible GPS route (a loop-ish jog) then normalize to an SVG polyline
random.seed(7)
lat,lon=24.7136,46.6753
pts=[(lat,lon)]
heading=0.4
for i in range(120):
    heading += random.uniform(-0.5,0.5)
    lat += math.cos(heading)*0.00018
    lon += math.sin(heading)*0.00018
    pts.append((lat,lon))
W,H,pad=300,230,22
lats=[p[0] for p in pts]; lons=[p[1] for p in pts]
latmin,latmax=min(lats),max(lats); lonmin,lonmax=min(lons),max(lons)
cos=math.cos(math.radians((latmin+latmax)/2))
spanx=max(1e-9,(lonmax-lonmin)*cos); spany=max(1e-9,latmax-latmin)
iw,ih=W-2*pad,H-2*pad
scale=min(iw/spanx,ih/spany)
offx=pad+(iw-spanx*scale)/2; offy=pad+(ih-spany*scale)/2
xy=[(offx+(lo-lonmin)*cos*scale, offy+(latmax-la)*scale) for la,lo in pts]
poly=' '.join(f'{x:.1f},{y:.1f}' for x,y in xy)
sx,sy=xy[0]; ex,ey=xy[-1]
trace=f'''<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <polyline points="{poly}" fill="none" stroke="{GRN}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="{sx:.1f}" cy="{sy:.1f}" r="6" fill="{GRN}" opacity="0.35"/>
  <circle cx="{ex:.1f}" cy="{ey:.1f}" r="6" fill="{GRN}"/><circle cx="{ex:.1f}" cy="{ey:.1f}" r="3" fill="#fff"/>
</svg>'''

def metric(val,lab):
    return f'<div style="flex:1;text-align:center"><div style="font-size:30px;font-weight:800;letter-spacing:-1px;color:{INK};font-variant-numeric:tabular-nums">{val}</div><div style="font-size:11px;letter-spacing:.6px;font-weight:600;color:{MUT}">{lab}</div></div>'

def seg():
    opts=[('Running','footprints',True),('Walking','footprints',False),('Cycling','bike',False)]
    n=len(opts); cells=''
    for i,(lab,ic,on) in enumerate(opts):
        col=INK if on else MUT
        cells+=f'<div style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 0;z-index:1">{svg(ic,15,col)}<span style="font-size:12.5px;font-weight:700;color:{col}">{lab}</span></div>'
    return f'<div style="position:relative;display:flex;background:{NAVBG};border-radius:99px;padding:4px;margin-bottom:16px"><div style="position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px)/{n});border-radius:99px;background:#FFFBF4"></div>{cells}</div>'

html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:14px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:28px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.map{{background:#FFFBF4;border:1px solid {BORD};border-radius:22px;height:230px;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.big{{text-align:center;margin:14px 0 6px}}
.bign{{font-size:64px;font-weight:800;letter-spacing:-2px;color:{GRN};line-height:1;font-variant-numeric:tabular-nums}}
.bigl{{font-size:11px;letter-spacing:1.2px;font-weight:700;color:{MUT};margin-top:4px}}
.row{{display:flex;background:#FFFBF4;border:1px solid {BORD};border-radius:22px;padding:16px 0;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.sub{{display:flex;justify-content:center;gap:28px;margin:12px 0 16px;font-size:12px;font-weight:600;color:{MUT}}}
.btn{{background:{NAVON};color:{NAVTX};border-radius:99px;padding:15px;text-align:center;font-size:16px;font-weight:700}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Track outdoors</div></div>
  <div class="map">{trace}</div>
  <div class="big"><div class="bign">3.84</div><div class="bigl">KILOMETRES</div></div>
  <div class="row">{metric('24:18','TIME')}{metric('6:19','PACE /KM')}{metric('312','KCAL')}</div>
  <div class="sub"><span>Avg pace 6:19/km</span><span>Elev +28 m</span></div>
  <div class="btn">Pause</div>
</div>
</body></html>'''
open('screen-track.html','w').write(html)
print('ok')
