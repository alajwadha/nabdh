import json
ICONS=json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))
def svg(name,size,color,sw=2):
    paths=''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
INK='#1F1C17';MUT='#80796C';SEC='#6B6457';GRN='#2E7D5B';BORD='#EDE5D3';NAVBG='#EFE8DA'
T={'pink':('#F8DCE4','#7A3A52'),'mint':('#D8EFE2','#1E5A40'),'peach':('#F7E3C2','#6B5328'),'gold':('#FBE5BE','#8A6312'),'blue':('#D6EBF6','#2C5C77')}
dishes=[('Kabsa with chicken','كبسة دجاج','640','pink'),('Lamb mandi','مندي لحم','700','pink'),('Foul medames','فول مدمس','220','mint'),('Dates','تمر','200','peach'),('Arabic coffee','قهوة عربية','5','gold')]
def rows(arfont):
    out=''
    for name,ar,kcal,col in dishes:
        bg,ink=T[col]
        out+=f'''<div style="display:flex;align-items:center;gap:12px;background:#FFFBF4;border:1px solid {BORD};border-radius:16px;padding:11px;margin-bottom:7px">
          <div style="width:40px;height:40px;border-radius:12px;background:{bg};display:flex;align-items:center;justify-content:center">{svg('utensils',18,ink)}</div>
          <div style="flex:1"><div style="font-size:14.5px;font-weight:700;color:{INK}">{name}</div><div style="font-family:{arfont};font-size:14px;font-weight:500;color:{MUT};margin-top:1px" dir="rtl">{ar}</div></div>
          <div style="font-size:16px;font-weight:800;color:{INK}">{kcal}</div></div>'''
    return out
def phone(arfont,label,badge):
    coach='صباح الخير علي ☀️ معدل تقلب ضربات القلب اليوم ممتاز' if arfont!='sys' else 'صباح الخير علي ☀️ معدل تقلب ضربات القلب اليوم ممتاز'
    af = 'Tajawal' if arfont=='taj' else "'Noto Naskh Arabic', serif"
    return f'''<div class="phone">
      <div class="tag" style="background:{badge[0]};color:{badge[1]}">{label}</div>
      <div style="background:#211E1A;border-radius:18px;padding:14px;margin-bottom:14px">
        <div style="font-size:11px;letter-spacing:1px;font-weight:700;color:rgba(255,248,236,.6)">YOUR COACH</div>
        <div style="font-family:{af};font-size:15px;font-weight:500;color:#FFF8EC;line-height:1.7;margin-top:4px" dir="rtl">{coach}</div>
      </div>
      {rows(af)}
    </div>'''
html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css">
<style>
@font-face{{font-family:'Tajawal';src:url('fonts/Tajawal-Medium.ttf') format('truetype');font-weight:500}}
@font-face{{font-family:'Tajawal';src:url('fonts/Tajawal-Bold.ttf') format('truetype');font-weight:700}}
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;gap:22px;padding:28px}}
.phone{{width:340px;background:#F7F1E8;border-radius:34px;padding:20px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.tag{{display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;padding:5px 12px;border-radius:99px;margin-bottom:14px}}
</style></head><body>
{phone('sys','BEFORE — SYSTEM ARABIC',('#F7E3C2','#6B5328'))}
{phone('taj','AFTER — TAJAWAL',('#D8EFE2','#1E5A40'))}
</body></html>'''
open('screen-font.html','w').write(html)
print('ok')
