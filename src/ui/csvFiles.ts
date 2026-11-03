import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { MAX_CSV_BYTES } from '../services/csvImport';

const CSV_MIME_TYPES = ['text/csv', 'text/comma-separated-values', 'text/plain'];

export interface PickedCsv {
  text: string;
  byteSize: number;
}

/** Lets the user pick a CSV file. The app reads it once and keeps no copy. */
export async function pickCsvFile(): Promise<PickedCsv | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: CSV_MIME_TYPES,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  try {
    // Check the size before reading so an oversized file is never loaded into memory.
    if (file.size > MAX_CSV_BYTES) return { text: '', byteSize: file.size };
    return { text: await file.text(), byteSize: file.size };
  } finally {
    if (file.exists) file.delete();
  }
}

/**
 * Hands CSV text to the Android share sheet. This is the only way user data leaves the app,
 * and only when the user asks. The temporary file is deleted afterwards.
 */
export async function shareCsvFile(fileName: string, csvText: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(csvText);
  try {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export word list' });
  } finally {
    if (file.exists) file.delete();
  }
}
