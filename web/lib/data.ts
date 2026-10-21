import seed from '@/content/seed-data.json';
export const DATA:any = seed;
export const sourceUrl = (row:any) => row?.sourceUrl || DATA.sources.find((s:any)=>s.id===row?.sourceId)?.url || 'https://mapleclassic.wiki/';
