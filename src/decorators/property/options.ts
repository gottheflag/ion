export type Options = {
	/**
	 * Reflect property changes to its HTML attribute.
	 * 
	 * @default true
	 */
	reflect?: boolean;

	/**
	 * Request a render when the property changes.
	 * 
	 * @default true
	 */
	render?: boolean;
	
	attribute?: string;
	type?: StringConstructor | NumberConstructor | BooleanConstructor;
};

export type Metadata = Options & {
	key: string;
	attribute: string;
};

export const DEFAULTS: Options = {
	reflect: true,
	render: true,
	type: String
};
