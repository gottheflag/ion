import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: [
			"dist/**",
			"node_modules/**",
			".vitest/**"
		]
	},

	eslint.configs.recommended,

	...tseslint.configs.strict,

	{
		files: [
			"**/*.ts"
		],

		rules: {
			"eqeqeq": [
				"error",
				"always",
				{
					null: "ignore"
				}
			],

			"no-duplicate-imports": "error",
			"no-empty": "error",
			"prefer-const": "error",

			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports"
				}
			],

			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_"
				}
			],

			/*
			 * Ion intentionally has dynamic framework boundaries
			 * around hooks, plugins, decorators, and DOM APIs.
			 *
			 * Do not force meaningless `unknown` gymnastics merely
			 * to satisfy a blanket lint rule.
			 */
			"@typescript-eslint/no-explicit-any": "off"
		}
	},

	{
		files: [
			"src/core/component.ts"
		],

		rules: {
			/*
			 * Component#on normalizes several event-target overloads into
			 * one local target variable. The alias is deliberate and does
			 * not escape the listener-registration scope.
			 */
			"@typescript-eslint/no-this-alias": "off"
		}
	},

	{
		files: [
			"src/core/create.ts",
			"src/hook/hook.ts",
			"src/plugin/runtime.ts"
		],
		
		rules: {
			/*
			 * These are deliberate static namespace-style runtime APIs,
			 * not classes intended for instantiation.
			 */
			"@typescript-eslint/no-extraneous-class": "off"
		}
	},

	{
		files: [
			"docs/**/*.js"
		],

		languageOptions: {
			globals: {
				document: "readonly",
				HTMLElement: "readonly",
				HTMLInputElement: "readonly",
				IntersectionObserver: "readonly",
				location: "readonly",
				matchMedia: "readonly"
			}
		}
	},

	{
		files: [
			"tests/**/*.ts"
		],

		rules: {
			/*
			 * Tests intentionally use type-probe expressions, impossible
			 * branches, and fixture assertions that are guaranteed by the
			 * immediately preceding setup.
			 */
			"no-constant-condition": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-unused-expressions": "off"
		}
	}
);
