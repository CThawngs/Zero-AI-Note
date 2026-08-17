import { getSql } from '@/lib/db';

/**
 * Storage Abstraction Layer for Zero AI Note
 * DATABASE CHÍNH: Neon Postgres (lưu notes, sources, metadata).
 * BACKUP STORAGE: Cloudflare R2 (S3-compatible) — dùng khi Neon database đầy.
 * Quyết định 2026-08-17: Neon database là chính, R2 là backup.
 *
 * Lớp này là nơi DUY NHẤT được phép gọi SDK storage.
 * Nếu tương lai chuyển sang Neon Object Storage (khi mở rộng region),
 * chỉ cần sửa đúng file này, không đụng codebase còn lại.
 *
 * Usage:
 *   const { uploadUrl, key } = await storageService.generatePresignedUploadUrl(userId, fileName, contentType);
 *   await fetch(uploadUrl, { method: 'PUT', body: file });
 *   await storageService.confirmUpload(key);
 */
export class StorageService {
  private readonly r2Endpoint?: string;
  private readonly r2AccessKey?: string;
  private readonly r2SecretKey?: string;
  private readonly r2Bucket?: string;

  constructor() {
    // Cloudflare R2 config (backup storage khi Neon database đầy)
    this.r2Endpoint = process.env.R2_ENDPOINT;
    this.r2AccessKey = process.env.R2_ACCESS_KEY;
    this.r2SecretKey = process.env.R2_SECRET_KEY;
    this.r2Bucket = process.env.R2_BUCKET;
  }

  private assertR2Configured(): void {
    if (!this.r2Endpoint || !this.r2AccessKey || !this.r2SecretKey || !this.r2Bucket) {
      throw new Error('Cloudflare R2 configuration missing. Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET.');
    }
  }

  private async createR2Client() {
    this.assertR2Configured();
    const { S3Client } = await import('@aws-sdk/client-s3');
    return new S3Client({
      region: 'auto',
      endpoint: this.r2Endpoint,
      credentials: {
        accessKeyId: this.r2AccessKey!,
        secretAccessKey: this.r2SecretKey!
      }
    });
  }

  /**
   * Generate presigned upload URL for a file
   */
  async generatePresignedUploadUrl(userId: string, fileName: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    this.assertR2Configured();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const uploadId = crypto.randomUUID();
    const key = `${userId}/${uploadId}/${encodeURIComponent(fileName)}`;

    const client = await this.createR2Client();
    const command = new PutObjectCommand({
      Bucket: this.r2Bucket,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    // Track pending upload in DB
    const sql = getSql();
    await sql`
      insert into uploads (id, user_id, file_key, file_name, content_type, status)
      values (${uploadId}, ${userId}, ${key}, ${fileName}, ${contentType}, 'pending')
    `;

    return { uploadUrl, key };
  }

  /**
   * Confirm that a file upload was successful
   */
  async confirmUpload(key: string): Promise<void> {
    const sql = getSql();
    await sql`
      update uploads
      set status = 'completed', completed_at = now()
      where file_key = ${key}
    `;
  }

  /**
   * Delete a file from R2 + mark upload deleted
   */
  async deleteFile(key: string): Promise<void> {
    this.assertR2Configured();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const client = await this.createR2Client();
    const command = new DeleteObjectCommand({
      Bucket: this.r2Bucket,
      Key: key
    });

    await client.send(command);

    const sql = getSql();
    await sql`
      update uploads
      set status = 'deleted', deleted_at = now()
      where file_key = ${key}
    `;
  }

  /**
   * Get public URL for a file (for display/playback)
   * Nếu có R2_PUBLIC_URL (domain custom) dùng nó, ngược lại dùng endpoint trực tiếp
   */
  async getPublicUrl(key: string): Promise<string> {
    this.assertR2Configured();
    const publicBase = process.env.R2_PUBLIC_URL ?? `${this.r2Endpoint}/${this.r2Bucket}`;
    return `${publicBase}/${key}`;
  }
}

// Singleton instance
export const storageService = new StorageService();