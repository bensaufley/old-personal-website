// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { rules: bestPracticeRules } = require('eslint-config-airbnb-base/rules/best-practices');
const { rules: styleRules } = require('eslint-config-airbnb-base/rules/style');

// if I could get these objects `as const` then this would all be settled,
// but TypeScript is reading the `rules` object as having values with `(string | Rule)[]`
// rather than [string, Rule] specifically. I like having access to exactly what the config
// contains, and this is the only way to get it that I can sort out.
/** @type {Exclude<typeof styleRules['camelcase'][1], string>} */
const camelcase = /** @type {any} */ (styleRules.camelcase[1]);
/** @type {Exclude<typeof bestPracticeRules['no-param-reassign'][1], string>} */
const noParamReassign = /** @type {any} */ (bestPracticeRules['no-param-reassign'][1]);

/** @type {import('eslint').Linter.Config} */
const config = {
  env: {
    browser: false,
    es6: true,
    node: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'plugin:prettier/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  plugins: ['@typescript-eslint', 'prettier'],
  root: true,
  rules: {
    camelcase: [
      /** @type {import('eslint').Linter.RuleLevel} */ (styleRules.camelcase[0]),
      {
        ...camelcase,
        allow: ['html_beautify'],
      },
    ],
    'no-console': 'off',
    'no-param-reassign': [
      /** @type {import('eslint').Linter.RuleLevel} */ (bestPracticeRules['no-param-reassign'][0]),
      {
        ...noParamReassign,
        ignorePropertyModificationsForRegex: ['^chunk$'],
      },
    ],
    'no-undef': 'off', // handled by TypeScript
    'no-unused-vars': 'off', // handled by TypeScript
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off', // there are no prod dependencies
    '@typescript-eslint/no-non-null-assertion': 'off', // not useful
  },
};

module.exports = config;
