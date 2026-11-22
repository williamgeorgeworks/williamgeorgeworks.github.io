import json,sys
d=json.load(open(sys.argv[1]))
for h in 'rtk':
  r=[x for x in d if x['hero']==h]
  if not r: continue
  tram=[f for x in r for f in x['fights'] if f['en']=='tram']
  print(h,'runs',len(r),'wins',sum(x['won'] for x in r),'avg pts',round(sum(x['pts'] or 0 for x in r)/len(r)),'avg rock',round(sum(x['rockGain'] for x in r)/len(r)),'avg sticks',sum(x['sticks'] for x in r)/len(r),
   '| tram',len(tram),'won',sum(f['won'] for f in tram),'turns',[f['turns'] for f in tram],'hp lost',[f['hp0']-f['hp1'] for f in tram],'hp0',[f['hp0'] for f in tram])
  print('  ended at',[ (x['places'] or ['?'])[-1] for x in r])
