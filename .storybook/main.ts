module.exports = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-essentials'],
  framework: '@storybook/html',
  core: { builder: 'storybook-builder-vite' },
}
