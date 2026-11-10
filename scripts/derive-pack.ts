/**
 * Makes a new version of a pack database, optionally with fonts, ready for npm run pack:sign:
 *
 *   npm run pack:derive -- <source.db> <output.db> --version <n> [--font <file>]...
 *
 * Useful for shipping fonts with a pack (e.g. Simplified fonts in the Mandarin pack) and for
 * making test updates of the built-in pack.
 */
import Database from 'better-sqlite3';
import { copyFileSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

import { PACK_FILE_NAME_PATTERN, PackFileKind } from '../src/data/packSchema';
import { PackMetadataKey } from '../src/domain/packMetadata';

function flagValues(args: readonly string[], flag: string): string[] {
  return args.flatMap((arg, index) => (arg === flag && args[index + 1] ? [args[index + 1]] : []));
}

function main(): void {
  const args = process.argv.slice(2);
  const [sourcePath, outputPath] = args;
  const [version] = flagValues(args, '--version');
  const packVersion = Number(version);
  if (!sourcePath || !outputPath || !Number.isSafeInteger(packVersion) || packVersion < 1) {
    console.error(
      'Usage: npm run pack:derive -- <source.db> <output.db> --version <n> [--font <file>]...',
    );
    process.exit(1);
  }
  rmSync(outputPath, { force: true });
  copyFileSync(sourcePath, outputPath);
  const database = new Database(outputPath);
  database
    .prepare('UPDATE pack_metadata SET value = ? WHERE key = ?')
    .run(String(packVersion), PackMetadataKey.PackVersion);
  const insertFile = database.prepare('INSERT INTO pack_files (name, kind, data) VALUES (?, ?, ?)');
  for (const fontPath of flagValues(args, '--font')) {
    const fileName = path.basename(fontPath);
    if (!PACK_FILE_NAME_PATTERN.test(fileName)) {
      console.error(`Rename ${fileName}: pack file names allow letters, digits, _ and - only.`);
      process.exit(1);
    }
    insertFile.run(fileName, PackFileKind.Font, readFileSync(fontPath));
  }
  database.exec('VACUUM');
  database.close();
  console.log(`Wrote ${outputPath} (pack version ${packVersion}).`);
}

main();
