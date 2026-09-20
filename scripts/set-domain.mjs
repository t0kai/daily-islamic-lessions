// Usage: node scripts/set-domain.mjs https://yourdomain.com [--ga G-XXXXXXX] [--gsc <search-console-token>]
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const args = process.argv.slice(2);
const dom = (args[0] || '').replace(/\/$/, '');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(dom)) { console.error('Give a domain like https://example.com'); process.exit(1); }
const opt = f => { const i = args.indexOf(f); return i > -1 ? args[i + 1] : ''; };
const ga = opt('--ga'), gsc = opt('--gsc');
if (ga && !/^G-[A-Z0-9]+$/.test(ga)) { console.error('GA id looks like G-XXXXXXXXXX'); process.exit(1); }
if (gsc && !/^[\w-]+$/.test(gsc)) { console.error('Bad Search Console token'); process.exit(1); }
let n = 0;
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p);
  else if (/\.(html|xml|txt|js|json|webmanifest)$/.test(f)) { let s = readFileSync(p, 'utf8'), o = s;
    s = s.split('https://YOUR-DOMAIN.example').join(dom);
    if (ga && f === 'config.js') s = s.replace('GA_ID:""', `GA_ID:"${ga}"`);
    if (gsc) s = s.split('GSC_TOKEN_PLACEHOLDER').join(gsc);
    if (s !== o) { writeFileSync(p, s); n++; } } } })('public');
console.log(`Updated ${n} files for ${dom}${ga ? ', GA ' + ga : ''}${gsc ? ', Search Console token set' : ''}.`);
