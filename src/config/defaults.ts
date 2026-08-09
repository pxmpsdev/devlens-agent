import type { DevLensConfig } from '../types/index.js';

export const DEFAULT_CONFIG: DevLensConfig = {
  scoring: {
    complexity: 0.35,
    duplication: 0.25,
    maintainability: 0.25,
    gitRisk: 0.15,
  },
  exclude: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'target',
    'coverage',
    '__pycache__',
    '.next',
    '.nuxt',
    'vendor',
    '.cache',
    '.turbo',
    '.storybook',
    'storybook-static',
    '.svelte-kit',
    '.env',
    '*.min.js',
    '*.min.css',
    '*.generated.*',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lock',
    'bun.lockb',
    '*.lock',
    '*.map',
    '*.d.ts',
    '*.d.mts',
    '*.d.cts',
    'CHANGELOG.md',
  ],
  thresholds: {
    complexity: {
      high: 20,
      warning: 10,
    },
    fileSize: 500,
    duplication: {
      minBlockLines: 6,
      warningThreshold: 0.05,
    },
    hotspot: {
      minChanges: 5,
      highRisk: 15,
    },
  },
  languages: ['typescript', 'javascript'],
};

export function getDefaultConfig(): DevLensConfig {
  return structuredClone(DEFAULT_CONFIG);
}
