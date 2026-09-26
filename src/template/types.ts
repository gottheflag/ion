export type TemplateValue =
	| string
	| number
	| bigint
	| boolean
	| null
	| undefined
	| Result
	| readonly TemplateValue[];

export type Result = {
	readonly strings: TemplateStringsArray;
	readonly values: readonly TemplateValue[];
};