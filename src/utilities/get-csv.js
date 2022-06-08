import fs_, {promises as fs} from 'fs';
import Papa from 'papaparse';

export default async function getCsv(path) {
    const file = await fs.readFile(path, 'utf-8');
    return Papa.parse(file, {header: true}).data;
}
