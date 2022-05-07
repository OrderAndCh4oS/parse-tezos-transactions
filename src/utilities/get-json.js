import {promises as fs} from 'fs';

export default async function getJson(path) {
    const file = await fs.readFile(path, 'utf-8');
    return JSON.parse(file);
}
