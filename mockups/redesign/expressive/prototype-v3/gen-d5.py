import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
GOLD=('#FBE5BE','#8A6312')
# achievements: (emoji, icon, label, earned)
badges=[('🔥','flame','12-day food streak',True),('🌙','moon','7 nights on time',True),('🚶','footprints','100k steps week',True),('🏆','trophy','30-day streak',False)]
# connect rows: (emoji, icon, label)
conn=[('👟','footprints','Steps & distance'),('❤️','heart','Heart rate & resting HR'),('📈','activity','Heart rate variability'),('😴','moon','Sleep analysis')]
def badgeset(after):
    out=''
    for em,ic,lab,earned in badges:
        op='1' if earned else '.4'
        art = svg(ic,24,GOLD[1] if earned else MUT) if after else f'<span style="font-size:24px">{em}</span>'
        bg = GOLD[0] if earned else NAVBG
        out+=f'<div style="width:74px;text-align:center;opacity:{op}"><div style="width:56px;height:56px;border-radius:18px;background:{bg};display:flex;align-items:center;justify-content:center;margin:0 auto 6px">{art}</div><div style="font-size:9.5px;font-weight:600;color:{MUT};line-height:1.2">{lab}</div></div>'
    return f'<div style="display:flex;justify-content:space-between">{out}</div>'
def connset(after):
    out=''
    for j,(em,ic,lab) in enumerate(conn):
        art = svg(ic,17,SEC) if after else f'<span style="font-size:15px">{em}</span>'
        top='' if j==0 else f'border-top:1px solid {BORD};'
        out+=f'<div style="display:flex;align-items:center;gap:13px;padding:10px 0;{top}"><div style="width:34px;height:34px;border-radius:11px;background:{NAVBG};display:flex;align-items:center;justify-content:center">{art}</div><div style="flex:1;font-size:14px;font-weight:700;color:{INK}">{lab}</div></div>'
    return out
def phone(after,label):
    bg='#D8EFE2' if after else '#F7E3C2'; tx='#1E5A40' if after else '#6B5328'
    return f'''<div class="phone">
      <div class="tag" style="background:{bg};color:{tx}">{label}</div>
      <div class="lbl">ACHIEVEMENTS</div>
      <div class="card">{badgeset(after)}</div>
      <div class="lbl">APPLE HEALTH · WILL READ</div>
      <div class="card" style="padding:6px 16px">{connset(after)}</div>
    </div>'''
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;gap:24px;padding:28px}}
.phone{{width:340px;background:#F7F1E8;border-radius:34px;padding:20px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.tag{{display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;padding:5px 12px;border-radius:99px;margin-bottom:16px}}
.lbl{{font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT};margin:14px 0 8px 2px}}
.card{{background:#FFFBF4;border:1px solid {BORD};border-radius:22px;padding:16px;box-shadow:0 6px 16px rgba(58,46,26,.1)}}
</style></head><body>
{phone(False,'BEFORE')}
{phone(True,'AFTER — LINE ICONS')}
</body></html>'''
open('screen-d5.html','w').write(html)
print('ok')
