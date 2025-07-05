import postcssOKLabFunction from '@csstools/postcss-oklab-function';

export default {
  plugins: {
    '@tailwindcss/postcss': {
      config: './tailwind.config.ts',
    },
    '@csstools/postcss-oklab-function': postcssOKLabFunction,
  },
};
