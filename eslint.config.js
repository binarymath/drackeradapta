import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
    { ignores: ['dist/**', 'node_modules/**', 'scripts/scratch/**', 'public/**'] },
    js.configs.recommended,
    {
        files: ['src/**/*.{js,jsx}'],
        plugins: { react, 'react-hooks': reactHooks },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser },
            parserOptions: { ecmaFeatures: { jsx: true } }
        },
        settings: { react: { version: 'detect' } },
        rules: {
            // Marca variáveis usadas apenas em JSX como "usadas"
            'react/jsx-uses-vars': 'error',
            'react/jsx-uses-react': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            // Começa como aviso para não bloquear: endurecer após a limpeza
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-empty': ['warn', { allowEmptyCatch: true }],
            'no-console': 'off',
            // Estilísticos: avisos por enquanto (limpeza gradual)
            'no-useless-escape': 'warn',
            'no-useless-assignment': 'warn',
            'preserve-caught-error': 'warn'
        }
    },
    {
        files: ['server.js', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'],
        languageOptions: { globals: { ...globals.node } }
    }
];
