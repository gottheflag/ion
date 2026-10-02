export const OPTIONS = Symbol("ion:custom-component:options");

/**
 * Component options.
 */
export type Options = {
	/**
	 * The native HTML element to extend.
	 *
	 * @default undefined
	 */
	extends?: string;

	/**
	 * Associate the component with native HTML forms.
	 *
	 * When enabled, Ion configures the custom element as form-associated,
	 * exposes the native form API through `this.formControl`, and automatically
	 * keeps the submitted value synchronized with `formValue`.
	 *
	 * @default false
	 */
	form?: boolean;
	
	/**
	 * Attached Shadow Root options.
	 */
	root?: Partial<ShadowRootInit>;
} | undefined;
