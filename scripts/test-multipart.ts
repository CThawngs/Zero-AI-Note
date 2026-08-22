/**
 * Test multipart ≥1GB giả lập: dùng lib-storage Upload class với local file 1GB
 * sinh bằng fs — kiểm chứng luồng part 10MB không lỗi memory.
 * (R2 thật cần credentials — phần sign/complete test trên production.)
 * Chạy: bun scripts/test-multipart.ts
 */
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) console.log(`PASS: ${msg}`);
  else { console.error(`FAIL: ${msg}`); failures++; }
};

(async () => {
  console.log('[TEST] lib-storage Upload với stream 1GB (không tải vào RAM)');
  const PART = 10 * 1024 * 1024;
  const TOTAL = 1024 * 1024 * 1024;

  // Stream sinh data lặp lại — KHÔNG cấp phát 1GB trong bộ nhớ
  let sent = 0;
  const stream = new Readable({
    read(size) {
      if (sent >= TOTAL) { this.push(null); return; }
      const chunk = Buffer.alloc(Math.min(size, TOTAL - sent), 0x61);
      sent += chunk.length;
      this.push(chunk);
    },
    highWaterMark: PART / 4,
  });

  // Không có S3 endpoint thật → mock client: chỉ verify Upload nhận stream,
  // chia part đúng và gọi onPart đúng số lần. Endpoint thật test trên prod.
  const partsSeen: number[] = [];
  const fakeClient = {
    send: async (cmd: any) => {
      const name = cmd.constructor.name;
      if (name === 'CreateMultipartUploadCommand') return { UploadId: 'test-upload-id' };
      if (name === 'UploadPartCommand') {
        partsSeen.push(cmd.input.PartNumber);
        return { ETag: `"etag-${cmd.input.PartNumber}"` };
      }
      if (name === 'CompleteMultipartUploadCommand') {
        return { Location: 'https://fake/test' };
      }
      throw new Error(`unexpected command ${name}`);
    },
    config: {
      region: 'auto',
      requestChecksumCalculation: async () => 'WHEN_REQUIRED',
      responseChecksumValidation: async () => 'WHEN_REQUIRED',
    },
  };

  const upload = new Upload({
    client: fakeClient as any,
    params: { Bucket: 'test-bucket', Key: 'test-1gb.bin', Body: stream },
    queueSize: 4,
    partSize: PART,
    leavePartsOnError: false,
  });

  upload.on('httpUploadProgress', (p) => {
    if (p.loaded && p.loaded % (100 * 1024 * 1024) === 0) {
      console.log(`  progress: ${Math.round(p.loaded / 1024 / 1024)}MB`);
    }
  });

  await upload.done();
  assert(partsSeen.length === Math.ceil(TOTAL / PART), `đúng số part: ${partsSeen.length} (kỳ vọng ${Math.ceil(TOTAL / PART)})`);
  const expected = Array.from({ length: Math.ceil(TOTAL / PART) }, (_, i) => i + 1);
  assert(JSON.stringify(partsSeen) === JSON.stringify(expected), 'part numbers tuần tự 1..N');

  // Memory check: RSS không nổ khi stream 1GB
  const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(`  peak RSS ~${memMB}MB`);
  assert(memMB < 600, `stream không load toàn bộ vào RAM (${memMB}MB < 600MB)`);

  console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
})();
