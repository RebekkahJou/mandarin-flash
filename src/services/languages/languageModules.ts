import { LanguageId } from '../../domain/language';
import type { LanguageModule } from './languageModule';
import { mandarinTraditionalModule } from './mandarinTraditionalModule';

export const LANGUAGE_MODULES: Readonly<Record<LanguageId, LanguageModule>> = {
  [LanguageId.MandarinTraditional]: mandarinTraditionalModule,
};

export function languageModuleFor(languageId: LanguageId): LanguageModule {
  return LANGUAGE_MODULES[languageId];
}
