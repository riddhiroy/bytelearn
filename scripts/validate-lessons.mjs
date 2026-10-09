#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'content/drafts';
const allowed = new Set(['title','text','flow','code','quiz','summary','callout']);
const errors = [];
const warnings = [];
const files = fs.existsSync(root) ? fs.readdirSync(root).filter(f => f.endsWith('.json')).sort() : [];
const ids = new Set();
const titles = new Map();
let count = 0;

function fail(file, message) { errors.push(`${file}: ${message}`); }
function nonEmpty(v) { return typeof v === 'string' && v.trim().length > 0; }
for (const file of files) {
  const full = path.join(root, file);
  let lesson;
  try { lesson = JSON.parse(fs.readFileSync(full, 'utf8')); }
  catch (e) { fail(file, `invalid JSON: ${e.message}`); continue; }
  count++;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lesson.id || '')) fail(file, 'id must be stable kebab-case');
  if (ids.has(lesson.id)) fail(file, `duplicate id ${lesson.id}`);
  ids.add(lesson.id);
  if (!nonEmpty(lesson.title)) fail(file, 'missing title');
  if (!nonEmpty(lesson.category)) fail(file, 'missing category');
  if (!nonEmpty(lesson.subtitle)) fail(file, 'missing subtitle');
  if (!nonEmpty(lesson.tag)) fail(file, 'missing tag');
  if (!Array.isArray(lesson.scenes) || lesson.scenes.length < 4 || lesson.scenes.length > 8) fail(file, 'scenes must contain 4–8 entries');
  const normalizedTitle = (lesson.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (normalizedTitle && titles.has(normalizedTitle)) warnings.push(`${file}: title similar to ${titles.get(normalizedTitle)}`);
  if (normalizedTitle) titles.set(normalizedTitle, file);
  const quizzes = (lesson.scenes || []).filter(s => s?.kind === 'quiz');
  if (quizzes.length !== 1) fail(file, 'must have exactly one quiz scene');
  for (const [i, s] of (lesson.scenes || []).entries()) {
    if (!s || !allowed.has(s.kind)) { fail(file, `scene ${i}: unsupported kind ${s?.kind}`); continue; }
    if (s.kind === 'flow' && (!Array.isArray(s.items) || s.items.length < 2 || s.items.some(x => !nonEmpty(x)))) fail(file, `scene ${i}: flow needs non-empty items`);
    if (['title','text','callout','summary'].includes(s.kind) && !nonEmpty(s.body)) fail(file, `scene ${i}: ${s.kind} requires body`);
    if (s.kind === 'code' && !nonEmpty(s.code)) fail(file, `scene ${i}: code requires code`);
    if (s.kind === 'quiz') {
      if (!nonEmpty(s.question)) fail(file, `scene ${i}: quiz requires question`);
      if (!Array.isArray(s.options) || s.options.length < 2 || s.options.some(x => !nonEmpty(x))) fail(file, `scene ${i}: quiz needs at least two non-empty options`);
      if (!Number.isInteger(s.answer) || s.answer < 0 || s.answer >= (s.options || []).length) fail(file, `scene ${i}: answer index out of range`);
      if (!nonEmpty(s.explanation)) warnings.push(`${file}: quiz explanation missing; add it to the content contract or UI`);
    }
    for (const [field, value] of Object.entries(s)) if (typeof value === 'string' && value.length > 650) warnings.push(`${file}: scene ${i} field ${field} exceeds 650 characters`);
  }
  if (!Array.isArray(lesson.source_refs) || lesson.source_refs.length === 0 || lesson.source_refs.some(s => !nonEmpty(s.title) || !/^https:\/\//.test(s.url || '') || !nonEmpty(s.supports))) fail(file, 'source_refs must include a title, HTTPS URL, and supported claim');
  if (lesson.published === true) fail(file, 'draft/approved JSON must not set published=true; publication is controlled by seeder');
}
if (process.env.REQUIRE_200 === '1') {
  const manifest = JSON.parse(fs.readFileSync('content/curriculum.json', 'utf8'));
  const expected = new Set(manifest.topics.map(t => t.id));
  for (const id of expected) if (!ids.has(id)) errors.push(`missing curriculum lesson: ${id}`);
  for (const id of ids) if (!expected.has(id)) errors.push(`lesson not in curriculum manifest: ${id}`);
  if (count !== 200) errors.push(`expected exactly 200 lesson files, found ${count}`);
}
console.log(`Checked ${count} lesson file(s) in ${root}`);
for (const w of warnings) console.warn('WARN ' + w);
for (const e of errors) console.error('ERROR ' + e);
if (errors.length) process.exit(1);
