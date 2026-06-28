def btn(bg, fg, label, border='', sheen=0.28):
    glare=f'background:linear-gradient(to bottom, rgba(255,255,255,{sheen}) 0%, rgba(255,255,255,{sheen*0.26}) 45%, rgba(255,255,255,0) 82%);' if sheen>0 else ''
    return f'''<div style="position:relative;overflow:hidden;border-radius:99px;background:{bg};{border};padding:16px;text-align:center;margin-bottom:14px">
      <div style="position:absolute;inset:0;{glare}"></div>
      <span style="position:relative;font-size:16px;font-weight:700;color:{fg}">{label}</span></div>'''
light=btn('#2E7D5B','#fff','Start fast')+btn('#211E1A','#FFF8EC','Pause',sheen=0.16)+btn('transparent','#1F1C17','End session','border:2px solid #EDE5D3',sheen=0)
dark=btn('#2E7D5B','#fff','Start fast')+btn('#F4EDDF','#1A160F','Pause',sheen=0.16)+btn('transparent','#F4EDDF','End session','border:2px solid #2E2920',sheen=0)
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;gap:24px;padding:30px}}
.phone{{width:340px;border-radius:36px;padding:26px 22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.tag{{display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;padding:5px 12px;border-radius:99px;margin-bottom:18px}}
</style></head><body>
<div class="phone" style="background:#F7F1E8">
  <div class="tag" style="background:#D8EFE2;color:#1E5A40">BUTTON GLARE · LIGHT</div>
  {light}
</div>
<div class="phone" style="background:#16130E">
  <div class="tag" style="background:#1C2A21;color:#A9DEC2">BUTTON GLARE · DARK</div>
  {dark}
</div>
</body></html>'''
open('screen-btn.html','w').write(html)
print('ok')
