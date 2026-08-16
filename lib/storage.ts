import { getSql } from '@/lib/db';
import { getAdminEmail } from '@/lib/auth/admin';

/**
 * Storage Abstraction Layer for Zero AI Note
 * Supports: Neon Object Storage (Beta) or Cloudflare R2
 *
 * Usage:
 *   const storage = new StorageService();
 *   const { uploadUrl, key } = await storage.generatePresignedUploadUrl(userId, fileName, contentType);
 *   await fetch(uploadUrl, { method: 'PUT', body: file });
 *   await storage.confirmUpload(key);
 */
export class StorageService {
  private readonly useNeonObjectStorage: boolean;
  private readonly r2Endpoint?: string;
  private readonly r2AccessKey?: string;
  private readonly r2SecretKey?: string;
  private readonly r2Bucket?: string;

  constructor() {
    // Check if we should use Neon Object Storage (Beta)
    // Neon Object Storage is only available in us-east-2 for new projects
    this.useNeonObjectStorage = process.env.USE_NEON_OBJECT_STORAGE === 'true';
    
    // Cloudflare R2 config (fallback)
    this.r2Endpoint = process.env.R2_ENDPOINT;
    this.r2AccessKey = process.env.R2_ACCESS_KEY;
    this.r2SecretKey = process.env.R2_SECRET_KEY;
    this.r2Bucket = process.env.R2_BUCKET;
  }

  /**
   * Generate presigned upload URL for a file
   */
  async generatePresignedUploadUrl(userId: string, fileName: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    if (this.useNeonObjectStorage) {
      return this.generateNeonPresignedUrl(userId, fileName, contentType);
    } else {
      return this.generateR2PresignedUrl(userId, fileName, contentType);
    }
  }

  /**
   * Generate Neon Object Storage presigned URL (Beta)
   */
  private async generateNeonPresignedUrl(userId: string, fileName: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    // In Neon Object Storage Beta, we use the Neon SQL API to generate presigned URLs
    // This is a simplified mock — replace with actual Neon Object Storage SDK when available
    const sql = getSql();
    const uploadId = crypto.randomUUID();
    const key = `${userId}/${uploadId}/${encodeURIComponent(fileName)}`;
    
    // Store the pending upload in the database
    await sql`
      insert into uploads (id, user_id, file_key, file_name, content_type, status)
      values (${uploadId}, ${userId}, ${key}, ${fileName}, ${contentType}, 'pending')
    `;
    
    // Mock presigned URL — replace with actual Neon Object Storage SDK call
    const uploadUrl = `/api/upload/neon?key=${key}&uploadId=${uploadId}`;
    
    return { uploadUrl, key };
  }

  /**
   * Generate Cloudflare R2 presigned URL
   */
  private async generateR2PresignedUrl(userId: string, fileName: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    if (!this.r2Endpoint || !this.r2AccessKey || !this.r2SecretKey || !this.r2Bucket) {
      throw new Error('Cloudflare R2 configuration missing');
    }
    
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    
    const uploadId = crypto.randomUUID();
    const key = `${userId}/${uploadId}/${encodeURIComponent(fileName)}`;
    
    const client = new S3Client({
      region: 'auto',
      endpoint: this.r2Endpoint,
      credentials: {
        accessKeyId: this.r2AccessKey,
        secretAccessKey: this.r2SecretKey
      }
    });
    
    const command = new PutObjectCommand({
      Bucket: this.r2Bucket,
      Key: key,
      ContentType: contentType
    });
    
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    
    // Store the pending upload in the database
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
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    if (this.useNeonObjectStorage) {
      await this.deleteNeonFile(key);
    } else {
      await this.deleteR2File(key);
    }
  }

  private async deleteNeonFile(key: string): Promise<void> {
    // Mock delete — replace with actual Neon Object Storage SDK call
    const sql = getSql();
    await sql`
      update uploads
      set status = 'deleted', deleted_at = now()
      where file_key = ${key}
    `;
  }

  private async deleteR2File(key: string): Promise<void> {
    if (!this.r2Endpoint || !this.r2AccessKey || !this.r2SecretKey || !this.r2Bucket) {
      throw new Error('Cloudflare R2 configuration missing');
    }
    
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    const client = new S3Client({
      region: 'auto',
      endpoint: this.r2Endpoint,
      credentials: {
        accessKeyId: this.r2AccessKey,
        secretAccessKey: this.r2SecretKey
      }
    });
    
    const command = new DeleteObjectCommand({
      Bucket: this.r2Bucket,
      Key: key
    });
    
    await client.send(command);
    
    // Update database
    const sql = getSql();
    await sql`
      update uploads
      set status = 'deleted', deleted_at = now()
      where file_key = ${key}
    `;
  }

  /**
   * Get public URL for a file (for display/playback)
   */
  async getPublicUrl(key: string): Promise<string> {
    if (this.useNeonObjectStorage) {
      return this.getNeonPublicUrl(key);
    } else {
      return this.getR2PublicUrl(key);
    }
  }

  private async getNeonPublicUrl(key: string): Promise<string> {
    // Mock public URL — replace with actual Neon Object Storage SDK call
    return `/api/upload/public?key=${key}`;
  }

  private async getR2PublicUrl(key: string): Promise<string> {
    if (!this.r2Endpoint) {
      throw new Error('Cloudflare R2 configuration missing');
    }
    return `${this.r2Endpoint}/${this.r2Bucket}/${key}`;
  }
}

// Singleton instance
export const storageService = new StorageService();