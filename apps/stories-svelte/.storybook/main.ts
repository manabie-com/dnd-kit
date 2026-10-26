import {readFileSync} from 'fs';
import {dirname, join} from 'path';

const sharedPreviewHead = readFileSync(
  join(__dirname, '..', '..', 'stories-shared', 'preview-head.html'),
  'utf-8'
);

export default {
  previewHead: (head: string) => `${sharedPreviewHead}\n${head}`,
  stories: ['../stories/**/*.stories.ts'],

  addons: [
    '@storybook/addon-links',
    '@vueless/storybook-dark-mode',
    '@dnd-kit/storybook-addon-codesandbox',
  ],

  framework: getAbsolutePath('@storybook/svelte-vite'),

  async viteFinal(config: any) {
    config.define = {
      ...config.define,
      'process.env': {},
    };
    config.optimizeDeps = {
      ...config.optimizeDeps,
      exclude: [...(config.optimizeDeps?.exclude || []), '@dnd-kit/*'],
    };
    return config;
  },
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')));
}
