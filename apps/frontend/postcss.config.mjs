import postcssOKLabFunction from '@csstools/postcss-oklab-function';

export default {
  plugins: {
    '@tailwindcss/postcss': {
      config: './tailwind.config.ts',
    },
    ...(process.env.NODE_ENV === 'production' ? [postcssOKLabFunction] : []),
  },
};
