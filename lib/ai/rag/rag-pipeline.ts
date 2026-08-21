/**
 * RAG Pipeline - Chia transcript thành chunks, embed và lưu vào source_embeddings (pgvector).
 * Khi user hỏi câu hỏi tiếp theo, tìm Top-K chunks bằng cosine similarity, gửi kèm vào chat context.
 */

export interface ChunkMetadata {
  chunkIndex: number;
  timestampStart: number;
  timestampEnd: number;
}

export interface EmbeddedChunk extends ChunkMetadata {
  content: string;
  embedding: number[];
}

export interface RAGChunk extends ChunkMetadata {
  content: string;
  similarity: number;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

const DEFAULT_CHUNK_SIZE = 400; // từ
const DEFAULT_TOP_K = 5;

/**
 * Chia transcript thành các chunks kèm timestamp
 */
export function chunkTranscript(
  transcript: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
): Array<{ content: string; startIdx: number; endIdx: number }> {
  const words = transcript.split(/\s+/);
  const chunks: Array<{ content: string; startIdx: number; endIdx: number }> = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push({
      content: words.slice(i, i + chunkSize).join(' '),
      startIdx: i,
      endIdx: Math.min(i + chunkSize, words.length),
    });
  }
  return chunks;
}

/**
 * Sinh embedding cho toàn bộ chunks và lưu vào DB
 */
export async function embedAndStoreChunks(
  chunks: Array<{ content: string; startIdx: number; endIdx: number }>,
  sourceId: string,
  userId: string,
  provider: EmbeddingProvider,
  sql: any,
): Promise<number> {
  let stored = 0;
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const embedding = await provider.embed(chunk.content);
    // Tính timestamp ước lượng dựa trên chunk index và giả định 150 words/min
    const wordsPerSec = 2.5;
    const timestampStart = Math.floor((chunk.startIdx / wordsPerSec));
    const timestampEnd = Math.floor((chunk.endIdx / wordsPerSec));

    await sql`
      insert into source_embeddings (source_id, user_id, content_chunk, chunk_index, timestamp_start, timestamp_end, embedding)
      values (
        ${sourceId}::uuid, ${userId}::uuid, ${chunk.content}, ${i},
        ${timestampStart}, ${timestampEnd}, ${JSON.stringify(embedding)}::vector
      )
      on conflict (source_id, chunk_index) do update set
        content_chunk = excluded.content_chunk,
        embedding = excluded.embedding
    `;
    stored += 1;
  }
  return stored;
}

/**
 * Truy vấn Top-K chunks liên quan nhất bằng cosine similarity
 */
export async function querySimilarChunks(
  question: string,
  sourceId: string,
  userId: string,
  provider: EmbeddingProvider,
  sql: any,
  topK = DEFAULT_TOP_K,
): Promise<RAGChunk[]> {
  const questionEmbedding = await provider.embed(question);
  const rows = await sql`
    select content_chunk, chunk_index, timestamp_start, timestamp_end,
           1 - (embedding <=> ${JSON.stringify(questionEmbedding)}::vector) as similarity
    from source_embeddings
    where source_id = ${sourceId}::uuid and user_id = ${userId}::uuid
    order by embedding <=> ${JSON.stringify(questionEmbedding)}::vector
    limit ${topK}
  `;
  return (rows as any[]).map((r) => ({
    content: r.content_chunk,
    chunkIndex: r.chunk_index,
    timestampStart: r.timestamp_start,
    timestampEnd: r.timestamp_end,
    similarity: parseFloat(r.similarity),
  }));
}
