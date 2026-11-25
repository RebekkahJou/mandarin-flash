import type { WordList } from '../../domain/wordList';
import { CsvTooLargeError, parseWordCsv } from '../../services/csvImport';
import { useAppServices } from '../AppServicesContext';
import { showMessage } from '../confirm';
import { pickCsvFile } from '../csvFiles';
import type { WordImportWording } from './useWordImport';
import { useWordImport } from './useWordImport';

export enum CsvImportResult {
  Imported = 'imported',
  NotImported = 'not_imported',
}

const CSV_IMPORT_WORDING: WordImportWording = {
  confirmTitle: 'Import words?',
  confirmLabel: 'Import',
  nothingNewTitle: 'Nothing to import',
};

/** Picks a CSV file, shows what would be imported into the target lists, then saves it. */
export function useCsvImport() {
  const { languageBundle } = useAppServices();
  const importWords = useWordImport();

  const importCsv = async (targetLists: readonly WordList[]): Promise<CsvImportResult> => {
    if (targetLists.length === 0) return CsvImportResult.NotImported;
    const picked = await pickCsvFile();
    if (!picked) return CsvImportResult.NotImported;
    try {
      const parsed = parseWordCsv(picked.text, languageBundle, picked.byteSize);
      const isImported = await importWords(parsed, targetLists, CSV_IMPORT_WORDING);
      return isImported ? CsvImportResult.Imported : CsvImportResult.NotImported;
    } catch (error) {
      const message =
        error instanceof CsvTooLargeError ? error.message : 'This file could not be read as a CSV.';
      showMessage('Import failed', message);
      return CsvImportResult.NotImported;
    }
  };

  return importCsv;
}
