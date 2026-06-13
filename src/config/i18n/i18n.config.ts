import { IGNORED_DIRS, SUPPORTED_LANGUAGES } from '@/common/constants';
import * as fs from 'fs/promises';
import type { I18nTranslation } from 'nestjs-i18n';
import { I18nLoader as Loader } from 'nestjs-i18n';
import * as path from 'path';

export class I18nLoader extends Loader {
  private cachedTranslations: I18nTranslation | null = null;

  // Supported languages
  languages = (): Promise<string[]> => Promise.resolve(SUPPORTED_LANGUAGES);

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

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
