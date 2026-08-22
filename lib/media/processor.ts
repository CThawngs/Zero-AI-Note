/**
 * MediaProcessor interface (ADR-002, PRD 4.0.4) — 2026-08-23
 *
 * Trừu tượng hoá media processing để không hard-code vendor.
 * Hiện chỉ có 1 implementation: InngestFFmpegProcessor (xem
 * inngest-ffmpeg-processor.ts). Giữ interface để mở rộng sau.
 *
 * Ngưỡng kích hoạt: file audio/video ≥100MB → processor; dưới ngưỡng
 * đi đường extract.ts Gemini native như hiện tại (DECISIONS.md §31.4).
 */

export interface MediaInfo {
  key: string;
  sizeBytes: number;
  mime: string;
  /** duration giây nếu đọc được từ metadata (ffmpeg), else null */
  durationSeconds: number | null;
}

export interface Segment {
  index: number;
  /** key R2 của segment đã ghi */
  key: string;
  /** thời lượng dự kiến giây */
  approxSeconds: number;
  /** offset tính từ đầu file gốc */
  offsetSeconds: number;
}

export type ProcessorFailureKind =
  | 'corrupt_file'   // ffmpeg exit != 0 + Invalid data → lỗi người dùng
  | 'timeout'        // step quá 300s → retry
  | 'quota_exceeded' // require_upgrade
  | 'unknown';

export const MEDIA_PROCESSOR_THRESHOLD_BYTES = 100 * 1024 * 1024; // 100MB

/** File audio/video đủ lớn cần chạy qua MediaProcessor? */
export function shouldUseMediaProcessor(sizeBytes: number, type: string): boolean {
  return (
    sizeBytes >= MEDIA_PROCESSOR_THRESHOLD_BYTES &&
    ['audio', 'video'].includes(type)
  );
}

export interface MediaProcessor {
  /** HEAD object — metadata không tải body */
  inspect(key: string): Promise<MediaInfo>;

  /**
   * Video → audio stream copy (-vn -c:a copy), KHÔNG re-encode.
   * Đọc R2 theo HTTP Range từng chunk 500MB/step (DECISIONS.md §31.2).
   * onProgress gọi sau mỗi chunk hoàn tất.
   */
  extractAudio(
    key: string,
    onProgress?: (bytesProcessed: number, totalBytes: number) => void
  ): Promise<{ audioKey: string; durationSeconds: number | null }>;

  /**
   * Cắt audio thành segment ~45 phút bằng -f segment -segment_time 2700 -c copy
   * (cắt theo keyframe → segment thực tế 30-60p). Ghi segments lên R2,
   * trả danh sách segment kèm offset cộng dồn.
   */
  createSegments(audioKey: string, targetMinutes?: number): Promise<Segment[]>;

  /** Trạng thái processing job */
  getStatus(jobId: string): Promise<
    | { state: 'queued' }
    | { state: 'running'; bytesProcessed: number; totalBytes: number }
    | { state: 'done'; segments: Segment[] }
    | { state: 'failed'; kind: ProcessorFailureKind; message: string }
  >;

  /** Phân loại failure: corrupt_file | timeout | quota_exceeded | unknown */
  handleFailure(err: unknown): { kind: ProcessorFailureKind; userMessage: string };
}
