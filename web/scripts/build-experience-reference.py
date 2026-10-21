"""Normalize the verified extent of MapleClassic Wiki's public EXP module."""
from pathlib import Path
import json, re, os
ROOT=Path(__file__).resolve().parents[1]
INPUT=Path(os.environ.get('MCW_REFERENCE_DIR','/private/tmp'))
raw=json.loads((INPUT/'mcw-exp-module.json').read_text())['parse']['wikitext']['*']
values={int(level):int(exp) for level,exp in re.findall(r'\[(\d+)\]\s*=\s*\{\s*(\d+),',raw)}
confirmed=re.search(r'LAST_CONFIRMED_LEVEL\s*=\s*(\d+)',raw)
if not confirmed:raise ValueError('The public module no longer declares a verified extent. Review it manually.')
last=int(confirmed.group(1));values={level:exp for level,exp in values.items() if 1<=level<=last}
if set(values)!=set(range(1,last+1)):raise ValueError('The confirmed EXP range has gaps.')
meta={'sourceUrl':'https://mapleclassic.wiki/wiki/Module:ExperienceCurve','license':'CC BY-NC-SA 4.0','verifiedAt':os.environ.get('MCW_VERIFIED_AT','2026-10-21'),'lastConfirmedLevel':last,'note':f'1~{last}레벨의 다음 레벨 필요 EXP만 등록. 이후 레벨은 미확인으로 자동 추정하지 않습니다.'}
(ROOT/'content/experience-curve.json').write_text(json.dumps({**meta,'toNext':values},ensure_ascii=False,indent=2)+'\n')
helpers='''
export function experienceToNext(level) { return EXP_TO_NEXT[Math.floor(Number(level))] ?? null; }
export function experienceBetween(from, to) {
  const a=Math.floor(Number(from)), b=Math.floor(Number(to));
  if (!Number.isFinite(a)||!Number.isFinite(b)||a<1||b<a) return null;
  let sum=0;for(let n=a;n<b;n++){const next=experienceToNext(n);if(next===null)return null;sum+=next;}return sum;
}
'''
(ROOT/'lib/experience-data.mjs').write_text('// Adapted factual reference: CC BY-NC-SA 4.0.\nexport const EXPERIENCE_REFERENCE = '+json.dumps(meta,ensure_ascii=False)+';\nexport const EXP_TO_NEXT = '+json.dumps(values)+';\n'+helpers)
print(f'Wrote {len(values)} verified EXP requirements; values after level {last} remain unknown')
