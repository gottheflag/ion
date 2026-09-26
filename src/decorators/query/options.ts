export type Options = {
	/**
	 * Whether to query all elements or just the first.
	 * 
	 * @default false
	 */
	all?: boolean;
};

/**
 * Default options for the query decorator.
 */
export const DEFAULTS: Options = {
	all: false,
};