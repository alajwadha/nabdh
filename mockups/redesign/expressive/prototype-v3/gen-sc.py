import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
MINT=('#D8EFE2','#1E5A40')
acts=[('Add water','+250 ml','droplet','nabdh://(tabs)'),('Start workout','Log gym or a sport','dumbbell','nabdh://workout'),
      ('Breathe','A calm minute','wind','nabdh://breathe'),('Track outdoors','GPS run / walk / ride','map-pin','nabdh://track')]
rows=''
for i,(t,s,ic,href) in enumerate(acts):
    top='' if i==0 else f'border-top:1px solid {BORD};'
    rows+=f'''<div style="display:flex;align-items:center;gap:13px;padding:11px 0;{top}">
      <div style="width:38px;height:38px;border-radius:12px;background:{NAVBG};display:flex;align-items:center;justify-content:center">{svg(ic,19,SEC)}</div>
      <div style="flex:1"><div style="font-size:15px;font-weight:700;color:{INK}">{t}</div><div style="font-size:12px;font-weight:600;color:{MUT}">{s}</div></div>
      {svg('chevron-right',18,MUT)}</div>'''
vrows=''
for (t,s,ic,href) in acts:
    vrows+=f'''<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0">
      <span style="font-size:13px;font-weight:600;color:{INK}">{t}</span>
      <span style="background:{NAVBG};border-radius:8px;padding:4px 8px;font-size:12px;font-weight:600;color:{SEC}">{href}</span></div>'''
# toggle ON
tog=f'<div style="width:46px;height:27px;border-radius:99px;background:{GRN};position:relative"><div style="position:absolute;top:3px;left:22px;width:21px;height:21px;border-radius:99px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.18)"></div></div>'
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:12px}}
.back{{width:38px;height:38px;border-radius:14px;background:{NAVBG};display:flex;align-items:center;justify-content:center}}
.h1{{font-size:27px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.intro{{font-size:14px;font-weight:500;line-height:1.5;color:{SEC};margin-bottom:16px}}
.card{{background:#FFFBF4;border:1px solid {BORD};border-radius:22px;padding:16px;margin-bottom:14px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
.lbl{{font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT};margin-bottom:6px}}
.note{{display:flex;gap:10px;align-items:flex-start;background:{NAVBG};border-radius:18px;padding:13px}}
.notetx{{font-size:12px;font-weight:600;color:{SEC};line-height:1.5}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Shortcuts</div></div>
  <div class="intro">Jump straight into the things you do most — from your home screen or by voice.</div>
  <div class="card"><div style="display:flex;align-items:center;gap:13px">
    <div style="width:40px;height:40px;border-radius:13px;background:{MINT[0]};display:flex;align-items:center;justify-content:center">{svg('zap',20,MINT[1])}</div>
    <div style="flex:1"><div style="font-size:16px;font-weight:700;color:{INK}">Home-screen actions</div><div style="font-size:12px;font-weight:600;color:{MUT}">Long-press the Nabdh icon for these</div></div>
    {tog}</div></div>
  <div class="card"><div class="lbl">QUICK ACTIONS</div>{rows}</div>
  <div class="card">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">{svg('message-circle',18,GRN)}<span style="font-size:16px;font-weight:700;color:{INK}">Voice &middot; Siri &amp; Assistant</span></div>
    <div style="font-size:12px;font-weight:600;color:{SEC};line-height:1.5;margin-bottom:6px">Add any of these links to the Siri Shortcuts app (iOS) or Google Assistant (Android) to open Nabdh by voice — e.g. &ldquo;Hey Siri, log my water.&rdquo;</div>
    {vrows}
  </div>
  <div class="note">{svg('sliders-horizontal',16,SEC)}<span class="notetx">Home-screen widgets (today&rsquo;s rings &amp; streaks at a glance) need a native widget extension — they&rsquo;re on the roadmap, not in this build yet.</span></div>
</div>
</body></html>'''
open('screen-sc.html','w').write(html)
print('ok')
