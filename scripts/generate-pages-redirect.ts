import path from 'path';
import { generatePagesRedirectBundle } from './lib/pages-redirect.js';

const outDir = path.resolve(process.cwd(), 'dist-pages');
generatePagesRedirectBundle(outDir);
console.log(`[Pages Redirect] Successfully generated redirect bundle (root, 404, ja, en, fr, zh, sw.js) in ${outDir}`);
