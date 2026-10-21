// Adapted factual reference: CC BY-NC-SA 4.0.
export const EXPERIENCE_REFERENCE = {"sourceUrl": "https://mapleclassic.wiki/wiki/Module:ExperienceCurve", "license": "CC BY-NC-SA 4.0", "verifiedAt": "2026-10-21", "lastConfirmedLevel": 49, "note": "1~49레벨의 다음 레벨 필요 EXP만 등록. 이후 레벨은 미확인으로 자동 추정하지 않습니다."};
export const EXP_TO_NEXT = {"1": 15, "2": 34, "3": 57, "4": 92, "5": 135, "6": 372, "7": 560, "8": 840, "9": 1242, "10": 1716, "11": 2360, "12": 3216, "13": 4200, "14": 5460, "15": 7050, "16": 8840, "17": 11040, "18": 13716, "19": 16680, "20": 20216, "21": 24402, "22": 28980, "23": 34320, "24": 40512, "25": 47216, "26": 54900, "27": 63666, "28": 73080, "29": 83720, "30": 95700, "31": 108480, "32": 122760, "33": 138666, "34": 155540, "35": 174216, "36": 194832, "37": 216600, "38": 240500, "39": 266682, "40": 294216, "41": 324240, "42": 356916, "43": 391160, "44": 428280, "45": 468450, "46": 510420, "47": 555680, "48": 604416, "49": 655200};

export function experienceToNext(level) { return EXP_TO_NEXT[Math.floor(Number(level))] ?? null; }
export function experienceBetween(from, to) {
  const a=Math.floor(Number(from)), b=Math.floor(Number(to));
  if (!Number.isFinite(a)||!Number.isFinite(b)||a<1||b<a) return null;
  let sum=0;for(let n=a;n<b;n++){const next=experienceToNext(n);if(next===null)return null;sum+=next;}return sum;
}
