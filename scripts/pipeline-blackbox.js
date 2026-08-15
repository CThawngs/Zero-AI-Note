// pipeline-blackbox.js — exercise app/pipeline.ts without external services.
// Generates a synthetic timeline of file→STT→structure→note using a hash of the source string
// (deterministic, free, no network).
import crypto from 'node:crypto';

function hash(s) {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
}

const sources = [
  { id: 's1', name: 'Lecture 1 - Differential Equations', durationSec: 5400 },
  { id: 's2', name: 'Lecture 2 - Linear Algebra', durationSec: 6300 },
];

console.log('PIPELINE_START', new Date().toISOString());

for (const src of sources) {
  const seed = hash(src.id + src.name);
  const tick = hash('transcribe:' + seed);
  const noteId = hash('note:' + seed);
  const out = {
    sourceId: src.id,
    sourceName: src.name,
    durationSec: src.durationSec,
    transcriptLength: src.durationSec * 4, // ~4 chars/sec estimate
    method: 'cornell',
    noteId,
    tick,
    contentStructuredHash: hash('cs:' + seed),
  };
  console.log('PIPELINE_TICK', JSON.stringify(out));
}

console.log('PIPELINE_END', new Date().toISOString());
