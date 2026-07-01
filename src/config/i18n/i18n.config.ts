import { IGNORED_DIRS, SUPPORTED_LANGUAGES } from './i18n.constant';
import * as fs from 'fs/promises';
import type { I18nTranslation } from 'nestjs-i18n';
import { I18nLoader as Loader } from 'nestjs-i18n';
import * as path from 'path';

/**
 * Custom `nestjs-i18n` loader that recursively discovers `locale`/`i18n`
 * folders under the project root, merges their per-language JSON files into
 * a single translation tree, and caches the result in memory.
 */
export class I18nLoader extends Loader {
  private cachedTranslations: I18nTranslation | null = null;

  /** Resolves to the list of language codes this loader supports. */
  languages = (): Promise<string[]> => Promise.resolve(SUPPORTED_LANGUAGES);

  /**
   * Loads and merges all translation files into a single `I18nTranslation` tree,
   * keyed by language and then by locale-folder name. Uses an in-memory cache
   * so the filesystem is only scanned once per process.
   *
   * @returns The merged translations for every supported language.
   */
  async load(): Promise<I18nTranslation> {
    if (this.cachedTranslations) return this.cachedTranslations;

    const baseDir = path.resolve(__dirname, '../../..');
    const translations: I18nTranslation = {};
    const langList = await this.languages();

    const localeFolders = await this.findLocaleFolders(baseDir);

    for (const lang of langList) {
      translations[lang] = {};

      for (const folder of localeFolders) {
        const folderName = path.basename(path.dirname(folder));
        const filePath = path.join(folder, `${lang}.json`);

        try {
          const content = await fs.readFile(filePath, 'utf8');
          const json = JSON.parse(content) as Record<string, string>;
          translations[lang] = this.deepMerge(translations[lang], {
            [folderName]: json,
          });
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.warn(`Failed to load i18n file: ${filePath}`, err);
          }
        }
      }
    }

    this.cachedTranslations = translations;
    return translations;
  }

  /**
   * Recursively searches a directory tree for folders named `locale` or `i18n`,
   * skipping any directory listed in {@link IGNORED_DIRS}.
   *
   * @param dir - Absolute path of the directory to start searching from.
   * @returns Absolute paths of every matching locale/i18n folder found.
   */
  private async findLocaleFolders(dir: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.includes(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.name === 'locale' || entry.name === 'i18n') {
          results.push(fullPath);
        } else {
          const subFolders = await this.findLocaleFolders(fullPath);
          results.push(...subFolders);
        }
      }
    }

    return results;
  }

  /**
   * Recursively merges `source` into `target`, deep-merging nested plain
   * objects and overwriting all other value types.
   *
   * @param target - Base object to merge into.
   * @param source - Object whose properties are merged onto `target`.
   * @returns A new object containing the merged result.
   */
  private deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const output: Record<string, unknown> = { ...target };

    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = output[key];

      if (this.isObject(sourceValue) && this.isObject(targetValue)) {
        output[key] = this.deepMerge(targetValue, sourceValue);
      } else {
        output[key] = sourceValue;
      }
    }

    return output as T;
  }

  /**
   * Type guard checking whether a value is a plain object (not `null` and not an array).
   *
   * @param value - Value to check.
   * @returns `true` if `value` is a plain object.
   */
  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
