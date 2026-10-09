#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const manifestPath = 'content/curriculum.json';
const outDir = process.env.LESSON_OUTPUT_DIR || 'content/drafts';
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
const force = process.argv.includes('--force');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
if (!apiKey) throw new Error('Set OPENAI_API_KEY in the trusted environment.');
if (!Number.isFinite(limit) && limit !== Infinity) throw new Error('--limit must be a number.');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.topics) || manifest.topics.length !== 200) {
  throw new Error(`Expected exactly 200 curriculum topics; found ${manifest.topics?.length ?? 0}.`);
}
fs.mkdirSync(outDir, { recursive: true });
const system = `You are ByteLearn's technical microlearning author. Produce accurate, practical lessons for working software engineers. Return exactly one JSON object, no markdown. Use only renderer scene kinds: title, text, flow, code, callout, summary, quiz. Create 5-8 scenes, exactly one quiz with 3-4 plausible options, a zero-based answer index and a useful explanation. Teach one objective with a realistic engineering situation, a failure mode/trade-off, and a concrete takeaway. Code must be correct and runnable where practical; otherwise label it pseudocode. Never invent benchmark numbers or claim tests were run. Include 1-3 relevant official/authoritative HTTPS source URLs you know are appropriate; do not fabricate obscure URLs. Category must exactly match the provided curriculum record. Use concise mobile-readable text. Do not include review, approval, or published fields.`;

function validate(lesson, topic) {
  const errors = [];
  if (lesson.id !== topic.id) errors.push('id does not match curriculum');
  if (lesson.category !== topic.category) errors.push('category does not match curriculum');
  for (const key of ['title', 'subtitle', 'tag']) if (typeof lesson[key] !== 'string' || !lesson[key].trim()) errors.push(`missing ${key}`);
  if (!Array.isArray(lesson.scenes) || lesson.scenes.length < 5 || lesson.scenes.length > 8) errors.push('scenes must contain 5-8 entries');
  const allowed = new Set(['title','text','flow','code','callout','summary','quiz']);
  for (const scene of lesson.scenes || []) {
    if (!allowed.has(scene?.kind)) errors.push(`unsupported scene kind: ${scene?.kind}`);
    if (['title','text','callout','summary'].includes(scene?.kind) && !(scene.body || '').trim()) errors.push(`empty body in ${scene.kind}`);
    if (scene?.kind === 'flow' && (!Array.isArray(scene.items) || scene.items.length < 2)) errors.push('flow needs at least two items');
    if (scene?.kind === 'code' && !(scene.code || '').trim()) errors.push('code scene is empty');
  }
  const quizzes = (lesson.scenes || []).filter(s => s?.kind === 'quiz');
  if (quizzes.length !== 1) errors.push('must have exactly one quiz');
  else {
    const q = quizzes[0];
    if (!q.question?.trim() || !Array.isArray(q.options) || q.options.length < 3 || q.options.some(o => typeof o !== 'string' || !o.trim())) errors.push('quiz needs a question and at least three options');
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options || []).length) errors.push('quiz answer index is invalid');
    if (!q.explanation?.trim()) errors.push('quiz explanation is required');
  }
  if (!Array.isArray(lesson.source_refs) || lesson.source_refs.length < 1 || lesson.source_refs.some(s => !/^https:\/\//.test(s.url || '') || !s.title || !s.supports)) errors.push('source_refs must contain titled HTTPS sources and supported claims');
  return errors;
}

async function generate(topic) {
  const target = path.join(outDir, `${topic.id}.json`);
  if (fs.existsSync(target) && !force) {
    try {
      const existing = JSON.parse(fs.readFileSync(target, 'utf8'));
      const existingErrors = validate(existing, topic);
      if (existingErrors.length === 0) return { id: topic.id, status: 'kept-existing' };
      console.log(`Regenerating ${topic.id}: existing file failed checks: ${existingErrors.join('; ')}`);
    } catch (error) {
      console.log(`Regenerating ${topic.id}: existing file is not valid JSON (${error.message})`);
    }
  }
  const user = {
    curriculum_topic: topic,
    output_contract: {
      id: topic.id, category: topic.category, title: 'string', subtitle: 'string', tag: 'string',
      difficulty: topic.difficulty, tags: ['string'], learning_objective: topic.objective,
      source_refs: [{ title: 'string', url: 'https URL', supports: 'claim supported' }],
      scenes: [{ kind: 'title|text|flow|code|callout|summary|quiz' }]
    },
    instructions: 'Use the exact id and category from the curriculum topic. Make this lesson distinct from generic definitions. Include a scenario, a decision/trade-off, a concrete example, and a useful quiz. Return valid JSON.'
  };
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          instructions: system,
          input: JSON.stringify(user),
          text: { format: { type: 'json_object' } }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `OpenAI API returned HTTP ${response.status}`);
      const outputText = data.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
      if (!outputText) throw new Error('No JSON output returned by model');
      const lesson = JSON.parse(outputText);
      const errors = validate(lesson, topic);
      if (errors.length) throw new Error(`validation failed: ${errors.join('; ')}`);
      fs.writeFileSync(target, JSON.stringify(lesson, null, 2) + '\n');
      return { id: topic.id, status: 'generated' };
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise(resolve => setTimeout(resolve, attempt * 1500));
    }
  }
  throw new Error(`Could not generate ${topic.id}: ${lastError?.message}`);
}

const todo = manifest.topics.filter(topic => {
  const target = path.join(outDir, `${topic.id}.json`);
  if (force || !fs.existsSync(target)) return true;
  try { return validate(JSON.parse(fs.readFileSync(target, 'utf8')), topic).length > 0; }
  catch { return true; }
}).slice(0, limit);
console.log(`Curriculum: ${manifest.topics.length} topics; generating ${todo.length}; model=${model}; force=${force}`);
let completed = 0;
for (let i = 0; i < todo.length; i += 3) {
  const batch = todo.slice(i, i + 3);
  const results = await Promise.all(batch.map(generate));
  for (const result of results) {
    completed++;
    console.log(`[${completed}/${todo.length}] ${result.id}: ${result.status}`);
  }
}
const remaining = manifest.topics.filter(t => !fs.existsSync(path.join(outDir, `${t.id}.json`)));
if (remaining.length === 0 && outDir === 'content/drafts') {
  for (const topic of manifest.topics) { topic.status = 'generated'; topic.batch = 1; }
  manifest.note = 'All 200 lesson files generated. Publication is automatic after deterministic validation; manual approval/review is not required.';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
console.log(`Generation pass finished. Existing/generated files: ${manifest.topics.length - remaining.length}/${manifest.topics.length}; missing: ${remaining.length}.`);
if (remaining.length) process.exitCode = 1;
