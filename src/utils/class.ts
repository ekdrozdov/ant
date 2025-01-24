// biome-ignore lint/suspicious/noExplicitAny: not supposed to be used for instantiation and cannot use "unknown[]" here.
export type ConstructorType<T> = abstract new (...args: any[]) => T;

export function isInstanceOf<T>(
	o: unknown,
	targetClass: ConstructorType<T>,
): o is T {
	return o instanceof targetClass;
}
