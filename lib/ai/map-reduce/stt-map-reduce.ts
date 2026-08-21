/**
 * STT Map-Reduce - Tầng 1: Cắt audio thành chunks 30-45 phút có overlap 30s
 * Sau đó chạy STT trên từng chunk và gộp lại thành Transcript hoàn chỉnh có timestamp.
 */

export interface AudioChunk {
  index: number;
  startSec: number;
  endSec: number;
  fileKey: string;
}

export interface TranscriptSegment {
  timestamp: number; // giây bắt đầu segment (tính theo audio gốc)
  text: string;
}

export interface FullTranscript {
  fullText: string;
  segments: TranscriptSegment[];
  totalDurationSec: number;
}

export interface SttMapReduceOptions {
  totalDurationSec: number;
  chunkSizeMin?: number;
  overlapSec?: number;
  sttFn: (chunk: AudioChunk) => Promise<TranscriptSegment[]>;
  concurrency?: number;
}

/**
 * Chia audio thành các chunk có overlap
 */
export function splitAudioIntoChunks(
  totalDurationSec: number,
  chunkSizeMin = 30,
  overlapSec = 30,
): AudioChunk[] {
  const chunkSizeSec = chunkSizeMin * 60;
  const chunks: AudioChunk[] = [];
  let start = 0;
  let idx = 0;
  while (start < totalDurationSec) {
    const end = Math.min(start + chunkSizeSec, totalDurationSec);
    chunks.push({
      index: idx,
      startSec: start,
      endSec: end,
      fileKey: `chunk_${idx}`,
    });
    if (end >= totalDurationSec) break;
    start = end - overlapSec;
    idx += 1;
  }
  return chunks;
}

/**
 * Chạy STT Map-Reduce. Concurrency được kiểm soát để không vượt rate limit của provider.
 */
export async function runSttMapReduce(opts: SttMapReduceOptions): Promise<FullTranscript> {
  const chunks = splitAudioIntoChunks(opts.totalDurationSec, opts.chunkSizeMin, opts.overlapSec);
  const concurrency = opts.concurrency ?? 2;

  const allSegments: TranscriptSegment[] = [];
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((c) => opts.sttFn(c)));
    batchResults.forEach((segments) => allSegments.push(...segments));
  }

  // Deduplicate overlapping (giữ segment thuộc chunk trước nếu timestamp nằm trong overlap zone)
  const dedup = deduplicateSegments(allSegments, chunks[chunks.length - 1].endSec);

  return {
    fullText: dedup.map((s) => `[${formatTimestamp(s.timestamp)}] ${s.text}`).join('\n'),
    segments: dedup,
    totalDurationSec: opts.totalDurationSec,
  };
}

function deduplicateSegments(segments: TranscriptSegment[], _maxSec: number): TranscriptSegment[] {
  const seen = new Set<string>();
  const out: TranscriptSegment[] = [];
  segments.forEach((s) => {
    const key = `${Math.floor(s.timestamp / 5)}_${s.text.substring(0, 30)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  });
  return out.sort((a, b) => a.timestamp - b.timestamp);
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
}
