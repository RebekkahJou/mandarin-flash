import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

/** Packs have no registered MIME type, so the picker shows every file and the installer checks. */
const ANY_FILE_TYPE = '*/*';

/**
 * Lets the user pick a pack file (route C) and hands its temporary copy to the installer, which
 * makes its own copy; the temporary one is deleted afterwards.
 */
export async function pickPackFile(install: (uri: string) => Promise<void>): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ANY_FILE_TYPE,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return false;
  const file = new File(result.assets[0].uri);
  try {
    await install(file.uri);
    return true;
  } finally {
    if (file.exists) file.delete();
  }
}
