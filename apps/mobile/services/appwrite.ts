/**
 * Appwrite Storage client for photo uploads.
 * Configure via EXPO_PUBLIC_APPWRITE_* in .env
 */
const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? '';
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? '';
const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID ?? '';
const API_KEY = process.env.EXPO_PUBLIC_APPWRITE_API_KEY ?? '';

export function getAppwriteConfig() {
  return { endpoint: ENDPOINT, projectId: PROJECT_ID, bucketId: BUCKET_ID, apiKey: API_KEY };
}

export function isAppwriteConfigured(): boolean {
  return !!(ENDPOINT && PROJECT_ID && BUCKET_ID && API_KEY);
}

/**
 * Upload a file to Appwrite Storage. Call from backend or use signed URL flow;
 * for mobile, backend should provide upload URL or proxy upload.
 */
export async function uploadFile(fileUri: string, fileName: string): Promise<string> {
  if (!isAppwriteConfigured()) throw new Error('Appwrite not configured');
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName, type: 'image/jpeg' } as unknown as Blob);
  const res = await fetch(`${ENDPOINT}/storage/buckets/${BUCKET_ID}/files`, {
    method: 'POST',
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': API_KEY,
    },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Upload failed');
  }
  const data = (await res.json()) as { $id: string };
  return data.$id;
}
