import { cosmiconfig } from 'cosmiconfig';
import type { DevLensConfig } from '../types/index.js';
import { DEFAULT_CONFIG, getDefaultConfig } from './defaults.js';

let cachedConfig: DevLensConfig | null = null;

export async function loadConfig(cwd?: string): Promise<DevLensConfig> {
  if (cachedConfig) return cachedConfig;

  const explorer = cosmiconfig('devlens', {
    searchPlaces: [
      '.devlensrc',
      '.devlensrc.json',
      '.devlensrc.yaml',
      '.devlensrc.yml',
      '.devlensrc.js',
      '.devlensrc.mjs',
      '.devlensrc.cjs',
      'devlens.config.js',
      'devlens.config.mjs',
      'devlens.config.cjs',
      'devlens.config.ts',
      'package.json',
    ],
  });

  try {
    const result = await explorer.search(cwd);
    if (result && !result.isEmpty) {
      cachedConfig = mergeConfig(getDefaultConfig(), result.config as Partial<DevLensConfig>);
      return cachedConfig;
    }
  } catch {
    // config file not found or invalid, use defaults
  }

  cachedConfig = getDefaultConfig();
  return cachedConfig;
}

export function resetConfigCache(): void {
  cachedConfig = null;
}

function mergeConfig(base: DevLensConfig, override: Partial<DevLensConfig>): DevLensConfig {
  return {
    ...base,
    ...override,
    scoring: { ...base.scoring, ...override.scoring },
    thresholds: {
      ...base.thresholds,
      ...override.thresholds,
      complexity: { ...base.thresholds.complexity, ...override.thresholds?.complexity },
      duplication: { ...base.thresholds.duplication, ...override.thresholds?.duplication },
      hotspot: { ...base.thresholds.hotspot, ...override.thresholds?.hotspot },
    },
    exclude: override.exclude ?? base.exclude,
    languages: override.languages ?? base.languages,
  };
}
