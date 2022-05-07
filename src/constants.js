import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const tzktUrl = 'https://api.tzkt.io/v1';

export const outDir = join(__dirname, '..', 'out');
