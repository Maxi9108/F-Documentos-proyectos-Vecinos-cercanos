import fs from 'fs';
import path from 'path';

export function getServiceKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  try {
    const envPath = path.resolve('apps/pwa/.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
      if (match) return match[1].trim();
    }
  } catch (_) {}
  return '';
}
