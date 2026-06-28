import json
ICONS = json.load(open('/home/user/nabdh/app/src/components/icon-paths.json'))

def svg(name, size, color, sw=2):
    paths = ''.join(f'<path d="{d}"/>' for d in ICONS[name])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')

# theme
INK='#1F1C17'; MUT='#80796C'; SEC='#6B6457'; GRN='#2E7D5B'
TILES={'mint':('#D8EFE2','#1E5A40'),'blue':('#D6EBF6','#2C5C77'),'peach':('#F7E3C2','#6B5328'),
       'lav':('#DDD6F6','#4A4080'),'gold':('#FBE5BE','#8A6312'),'pink':('#F8DCE4','#7A3A52')}

friends=[('You',248,6,True),('Layla Haddad',312,11,False),('Omar Nasser',205,3,False),
         ('Sara Kassab',287,8,False),('Yousef Amir',164,2,False),('Hana Rahimi',96,1,False)]
ranked=sorted(friends,key=lambda f:-f[1])
my_rank=[i for i,f in enumerate(ranked) if f[3]][0]+1

def initials(n):
    p=n.split()
    return (p[0][0]+p[-1][0]).upper() if len(p)>1 else p[0][:2].upper()

def row(rank,f):
    name,mins,streak,you=f
    sel='background:#D8EFE2;margin:0 -12px;padding:8px 12px;border-radius:14px;' if you else ''
    if rank<=3:
        col={1:'#C79A2E',2:'#9AA0A6',3:'#B07A4A'}[rank]
        badge=svg('trophy',18,col)
    else:
        badge=f'<span style="font-size:15px;font-weight:800;color:{MUT};font-variant-numeric:tabular-nums">{rank}</span>'
    av_bg= GRN if you else '#D6EBF6'
    av_fg= '#fff' if you else '#2C5C77'
    mcol= '#1E5A40' if you else INK
    return f'''<div style="display:flex;align-items:center;gap:12px;padding:9px 0;{sel}">
      <div style="width:26px;text-align:center;display:flex;justify-content:center">{badge}</div>
      <div style="width:40px;height:40px;border-radius:20px;background:{av_bg};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:{av_fg}">{initials(name)}</div>
      <div style="flex:1">
        <div style="font-size:15px;font-weight:700;color:{INK}">{name}</div>
        <div style="display:flex;align-items:center;gap:4px;margin-top:1px">{svg('flame',12,MUT)}<span style="font-size:12px;font-weight:600;color:{MUT}">{streak}-day streak</span></div>
      </div>
      <div style="text-align:right"><div style="font-size:19px;font-weight:800;color:{mcol};font-variant-numeric:tabular-nums;line-height:1.1">{mins}</div><div style="font-size:12px;font-weight:600;color:{MUT}">min</div></div>
    </div>'''

rows=''
for i,f in enumerate(ranked):
    if i>0: rows+='<div style="height:1px;background:#EDE5D3"></div>'
    rows+=row(i+1,f)

def ordinal(n): return {1:'1st',2:'2nd',3:'3rd'}.get(n,f'{n}th')

def challenge(title,blurb,icon,tint,prog,goal,unit,days,parts,joined):
    bg,ink=TILES[tint]
    pct=round(prog/goal*100)
    head=f'''<div style="display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;border-radius:14px;background:{bg};display:flex;align-items:center;justify-content:center">{svg(icon,22,ink)}</div>
      <div style="flex:1"><div style="font-size:16px;font-weight:700;color:{INK}">{title}</div><div style="font-size:12px;font-weight:600;color:{MUT};margin-top:1px">{blurb}</div></div>
    </div>'''
    if joined:
        body=f'''<div style="display:flex;align-items:baseline;justify-content:space-between;margin-top:12px">
          <div style="display:flex;align-items:baseline;gap:5px"><span style="font-size:20px;font-weight:800;color:{ink};font-variant-numeric:tabular-nums">{prog}</span><span style="font-size:12px;font-weight:600;color:{MUT}">/ {goal} {unit}</span></div>
          <span style="font-size:12px;font-weight:600;color:{MUT}">{pct}%</span></div>
        <div style="height:8px;border-radius:99px;background:#EFE8DA;overflow:hidden;margin-top:8px"><div style="width:{pct}%;height:100%;border-radius:99px;background:{ink}"></div></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
          <div style="display:flex;align-items:center;gap:5px">{svg('users',13,MUT)}<span style="font-size:12px;font-weight:600;color:{MUT}">{parts} in · {days}d left</span></div>
          <span style="font-size:12px;font-weight:600;color:{MUT}">Leave</span></div>'''
    else:
        body=f'''<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px">
          <div style="display:flex;align-items:center;gap:5px">{svg('users',13,MUT)}<span style="font-size:12px;font-weight:600;color:{MUT}">{parts} in · {days}d left</span></div>
          <div style="border:2px solid #EDE5D3;border-radius:99px;padding:8px 20px;font-size:14px;font-weight:700;color:{INK}">Join</div></div>'''
    return f'<div style="background:#FFFBF4;border:1px solid #EDE5D3;border-radius:22px;padding:16px;margin-bottom:12px;box-shadow:0 6px 16px rgba(58,46,26,.1)">{head}{body}</div>'

challenges=(
    challenge('June Move Streak','Log 30 active minutes a day, all month.','flame','peach',22,30,'days',2,48,True)+
    challenge('100 km Together','A team push to cover 100 km of walking & running.','footprints','blue',63,100,'km',9,12,True)+
    challenge('Strong September','Hit 16 strength sessions before the month ends.','dumbbell','mint',5,16,'workouts',21,34,False)
)

me=[f for f in friends if f[3]][0]
hero=f'''<div style="background:#211E1A;border-radius:22px;padding:16px;display:flex;align-items:center;gap:12px">
  <div style="width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center">{svg('trophy',26,'#F4CE7C')}</div>
  <div style="flex:1"><div style="font-size:11px;letter-spacing:1.2px;font-weight:700;color:rgba(255,248,236,.7)">YOUR RANK THIS WEEK</div>
  <div style="display:flex;align-items:baseline;gap:8px;margin-top:2px"><span style="font-size:34px;font-weight:800;letter-spacing:-1px;color:#FFF8EC;font-variant-numeric:tabular-nums">{ordinal(my_rank)}</span><span style="font-size:12px;font-weight:600;color:rgba(255,248,236,.7)">of {len(friends)} · {me[1]} min</span></div></div>
</div>'''

board=f'''<div style="background:#FFFBF4;border:1px solid #EDE5D3;border-radius:22px;padding:16px;box-shadow:0 6px 16px rgba(58,46,26,.1)">
  <div style="font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT};margin-bottom:6px">LEADERBOARD · ACTIVE MINUTES</div>{rows}</div>'''

html=f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="pjs-local.css"><style>
*{{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}}
body{{background:#cfc7b6;display:flex;justify-content:center;padding:26px}}
.phone{{width:392px;background:#F7F1E8;border-radius:34px;padding:22px;box-shadow:0 30px 90px rgba(20,16,10,.22)}}
.hd{{display:flex;align-items:center;gap:12px;margin-bottom:14px}}
.back{{width:38px;height:38px;border-radius:14px;background:#EFE8DA;display:flex;align-items:center;justify-content:center}}
.h1{{font-size:28px;font-weight:800;letter-spacing:-.6px;color:{INK}}}
.lbl{{font-size:11px;letter-spacing:1.4px;font-weight:700;color:{MUT};margin:18px 0 10px 2px}}
.foot{{text-align:center;font-size:12px;font-weight:600;color:{MUT};margin-top:6px}}
</style></head><body>
<div class="phone">
  <div class="hd"><div class="back">{svg('chevron-left',22,INK)}</div><div class="h1">Friends</div></div>
  {hero}
  <div style="height:16px"></div>
  {board}
  <div class="lbl">CHALLENGES</div>
  {challenges}
  <div class="foot">Friends &amp; challenges are a preview with sample data.</div>
</div>
</body></html>'''
open('screen-social.html','w').write(html)
print('wrote screen-social.html')
