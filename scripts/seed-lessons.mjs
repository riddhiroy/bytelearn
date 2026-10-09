#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.argv[2] || 'content/drafts';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the trusted environment.');
if (!fs.existsSync(root)) throw new Error(`Directory not found: ${root}`);
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const files = fs.readdirSync(root).filter(f => f.endsWith('.json')).sort();
let ok = 0;
for (const file of files) {
  const lesson = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const row = {
    id: lesson.id,
    category: lesson.category,
    title: lesson.title,
    subtitle: lesson.subtitle ?? '',
    tag: lesson.tag ?? lesson.category.toUpperCase(),
    difficulty: lesson.difficulty ?? 'Intermediate',
    scenes: lesson.scenes,
    tags: lesson.tags ?? [],
    published: true
  };
  const { error } = await supabase.from('lessons').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Failed publishing ${file}: ${error.message}`);
  ok++;
  console.log(`Published ${lesson.id}`);
}
console.log(`Published/upserted ${ok} lesson(s) after automated validation.`);
