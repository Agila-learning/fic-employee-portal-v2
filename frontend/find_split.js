import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, 'dist', 'assets');
const files = fs.readdirSync(dir);
const layoutFile = files.find(f => f.startsWith('DashboardLayout-') && f.endsWith('.js'));

if (layoutFile) {
  const code = fs.readFileSync(path.join(dir, layoutFile), 'utf8');
  let match;
  const regex = /[\s\S]{0,100}\.split\([\s\S]{0,100}/g;
  while ((match = regex.exec(code)) !== null) {
    console.log('MATCH in', layoutFile, ':\n', match[0], '\n------------------------');
  }
} else {
  console.log('Dashboard layout file not found');
}
