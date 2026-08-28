import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { createHash } from 'crypto';
export interface UploadedEvidenceFile { buffer: Buffer; mimetype: string; size: number; originalname: string; }

@Injectable()
export class EvidenceService {
  private configured(): boolean { return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET); }
  async upload(file: UploadedEvidenceFile, publicId: string): Promise<void> {
    if (!this.configured()) throw new ServiceUnavailableException('Cloudinary no está configurado');
    const timestamp = Math.floor(Date.now()/1000); const signature = createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}&type=authenticated${process.env.CLOUDINARY_API_SECRET}`).digest('hex');
    const form = new FormData(); form.append('file', new Blob([new Uint8Array(file.buffer)], { type:file.mimetype }), file.originalname); form.append('public_id', publicId); form.append('type','authenticated'); form.append('timestamp',String(timestamp)); form.append('api_key',process.env.CLOUDINARY_API_KEY!); form.append('signature',signature);
    await axios.post(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, form, { timeout:30000 });
  }
  accessUrl(publicId: string): string | null {
    if (!this.configured()) return null;
    const timestamp = Math.floor(Date.now() / 1000); const expiresAt = timestamp + 300;
    const signature = createHash('sha1').update(`expires_at=${expiresAt}&public_id=${publicId}&timestamp=${timestamp}&type=authenticated${process.env.CLOUDINARY_API_SECRET}`).digest('hex');
    return `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/download?public_id=${encodeURIComponent(publicId)}&type=authenticated&expires_at=${expiresAt}&timestamp=${timestamp}&api_key=${process.env.CLOUDINARY_API_KEY}&signature=${signature}`;
  }
}
