const { rules: bestPracticeRules } = require('eslint-config-airbnb-base/rules/best-practices');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    module: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 11,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  plugins: ['prettier'],
  rules: {
    'no-param-reassign': [
      bestPracticeRules['no-param-reassign'][0],
      {
        ...(bestPracticeRules)['no-param-reassign'][1],
        ignorePropertyModificationsForRegex: ['^chunk$'],
      },
    ],
  },
};
