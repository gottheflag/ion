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
	 * Attached Shadow Root options.
	 */
	root?: Partial<ShadowRootInit>;
} | undefined;