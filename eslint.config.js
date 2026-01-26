import js from '@eslint/js';
import vue from 'eslint-plugin-vue';

// 导入并使用vue-eslint-parser
import vueEslintParser from 'vue-eslint-parser';

export default [
  {
    files: ['**/*.{vue,js}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // 浏览器全局变量
        indexedDB: 'readonly',
        localStorage: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        document: 'readonly',
        window: 'readonly',
        FileReader: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        console: 'readonly',
        // 构建注入变量
        __COMMIT_HASH__: 'readonly',
        __COMMIT_DATE__: 'readonly',
        __BUILD_TIME__: 'readonly',
        // 其他全局变量
        browser: true,
        node: true
      }
    },
    rules: {
      // 基础JS规则
      ...js.configs.recommended.rules,
      // 自定义规则
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': 'error',
      'no-console': 'warn',
      'no-debugger': 'warn',
      // Vue规则
      'vue/multi-word-component-names': 'off'
    }
  },
  // 为Vue文件单独配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      // 使用导入的vue-eslint-parser对象
      parser: vueEslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      vue
    },
    rules: {
      // Vue规则
      ...vue.configs['flat/base'].rules
    }
  }
];