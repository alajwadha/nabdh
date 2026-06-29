def btn(bg, fg, label, border='', strength=0.35, line=False):
    H=54
    refl='' if line else f'''<div style="position:absolute;left:16%;top:-62%;width:68%;height:92%;border-radius:50%;background:rgba(255,255,255,{strength});filter:blur(7px)"></div>'''
    return f'''<div style="position:relative;overflow:hidden;border-radius:99px;background:{bg};{border};height:{H}px;display:flex;align-items:center;justify-content:center;margin-bottom:14px">
      {refl}
      <span style="position:relative;font-size:16px;font-weight:700;color:{fg}">{label}</span></div>'''
light=btn('#2E7D5B','#fff','Start fast')+btn('#211E1A','#FFF8EC','Pause',strength=0.20)+btn('transparent','#1F1C17','End session','border:2px solid #EDE5D3',line=True)
dark=btn('#2E7D5B','#fff','Start fast')+btn('#F4EDDF','#1A160F','Pause',strength=0.22)+btn('transparent','#F4EDDF','End session','border:2px solid #2E2920',line=True)
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;gap:24px;padding:30px}}
.phone{{width:340px;border-radius:36px;padding:26px 22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.tag{{display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;padding:5px 12px;border-radius:99px;margin-bottom:18px}}
</style></head><body>
<div class="phone" style="background:#F7F1E8"><div class="tag" style="background:#D8EFE2;color:#1E5A40">REFLECTION · LIGHT</div>{light}</div>
<div class="phone" style="background:#16130E"><div class="tag" style="background:#1C2A21;color:#A9DEC2">REFLECTION · DARK</div>{dark}</div>
</body></html>'''
open('screen-btn2.html','w').write(html)
print('ok')
