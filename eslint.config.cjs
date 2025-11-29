const globals = require('globals');

const eslintIronPlateConfig = require('eslint-config-ironplate/node.js').default;

module.exports = [
    {
        // https://eslint.org/docs/latest/use/configure/ignore
        //
        // IMPORTANT:
        //     * https://github.com/eslint/eslint/discussions/18304#discussioncomment-9069706
        //     * https://github.com/eslint/eslint/discussions/17429#discussioncomment-6579229
        ignores: [
            // 'node_modules/**' is ignored by default

            // Temporary files
            'temp/**',
            'tmp/**'
        ]
    },

    ...eslintIronPlateConfig,

    {
        files: [
            '**/*.cjs',
            '**/*.js',
            '**/*.mjs',
            '**/*.mts',
            '**/*.ts'
        ],

        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                // Full Node.js globals including CommonJS
                ...globals.node
            }
        },

        // Add ESLint plugins here. If they are stable and useful, move those as a pull
        // request to https://github.com/webextensions/eslint-config-ironplate/
        plugins: {
        },

        // Add ESLint rules here. If they are stable and useful, move those as a pull
        // request to https://github.com/webextensions/eslint-config-ironplate/
        rules: {
        }
    }
];
