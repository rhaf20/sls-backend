import {BadRequestException,} from '../utils';
import {ValidatorUtil as vu} from '../utils/validator.util';


export function NotNull() {
	return function (target: any, key: string) {

		let val = target[key];

		const getter = function () {
			return val;
		};

		const setter = (next: any) => {
			if (vu.isNull(next)) {
				throw new BadRequestException(`Parameter ${key} is required`);
			}
			val = next;
		};

		Object.defineProperty(target, key, {
			get: getter,
			set: setter,
			enumerable: true,
			configurable: true
		});
	}
}

export function NotBlank() {
	return function (target: any, key: string) {

		let val = target[key];

		const getter = function () {
			return val;
		};

		const setter = (next: string) => {
			if (vu.isNull(next)) {
				throw new BadRequestException(`Parameter ${key} is required`);
			} else if (next.trim().length === 0) {
				throw new BadRequestException(`Parameter ${key} cannot be blank`);
			}
			val = next;
		};

		Object.defineProperty(target, key, {
			get: getter,
			set: setter,
			enumerable: false,
			configurable: false
		});
	}
}

export function NotEmpty() {
	return function (target: any, key: string) {

		let val = target[key];

		const getter = function () {
			return val;
		};

		const setter = (next: any[]) => {
			if (vu.isNull(next)) {
				throw new BadRequestException(`Parameter ${key} is required`);
			} else if (next.length === 0) {
				throw new BadRequestException(`Parameter ${key} cannot be empty`);
			}
			val = next;
		};

		Object.defineProperty(target, key, {
			get: getter,
			set: setter,
			enumerable: true,
			configurable: true
		});
	}
}

export function Limit(min: number, max: number) {
	return function (target: any, key: string) {

		let val: number = target[key];

		const getter = function () {
			return val;
		};

		const setter = (next: number) => {
			if (vu.isNull(next)) {
				throw new BadRequestException(`Parameter ${key} is required`);
			} else if (vu.notNull(min) && next < min) {
				throw new BadRequestException(`Minimum permissible value for ${key} : ${min}`);
			} else if (vu.notNull(max) && next > max) {
				throw new BadRequestException(`Maximum permissible value for ${key} : ${max}`);
			}
			val = next;
		};

		Object.defineProperty(target, key, {
			get: getter,
			set: setter,
			enumerable: true,
			configurable: true
		});
	}
}

export function Pattern(format: string | RegExp, allowBlank: boolean) {
	return function (target: any, key: string) {
		let val = target[key];

		const getter = function () {
			return val;
		};

		const setter = (next: string | string[]) => {
			if (vu.isNull(next)) {
				if (!allowBlank) {
					throw new BadRequestException(`Parameter ${key} is required`);
				}
			} else {
				if (typeof next === 'string') {
					if (!vu.validateStringPattern(next, format)) {
						throw new BadRequestException(`Invalid value for ${key} : ${next}`);
					}
				} else if (next instanceof Array) {
					for (const value of next) {
						if (vu.isBlank(value) || !vu.validateStringPattern(value, format)) {
							throw new BadRequestException(`Invalid value under ${key} : ${value}`);
						}
					}
				} else {
					throw new BadRequestException(`Invalid format for ${key}`);
				}
			}
			val = next;
		};

		Object.defineProperty(target, key, {
			get: getter,
			set: setter,
			enumerable: true,
			configurable: true
		});
	}
}

export function Enumed(theEnum: any, allowNull: boolean) {
	return function (target: any, key: string) {

		let val = target[key];

		const getter = function () {
			return val;
		};

		const setter = (next: any) => {
			if (vu.isBlank(next)) {
				if (!allowNull) {
					throw new BadRequestException(`Parameter ${key} is required`);
				}
			} else if (!Object.values(theEnum).includes(next)) {
				throw new BadRequestException(`Invalid value for ${key} : ${next}`);
			}
			val = next;
		};

		Object.defineProperty(target, key, {
			get: getter,
			set: setter,
			enumerable: true,
			configurable: true
		});
	}
}

export function Embedded(validateFn: any, allowEmpty: boolean) {
	return function (target: any, key: string) {

		let val: any[] = target[key];

		const getter = function () {
			return val;
		};

		const setter = (next: any[]) => {
			if (vu.isEmpty(next)) {
				if (!allowEmpty) {
					throw new BadRequestException(`Parameter ${key} is required`);
				}
			} else {
				const errors: string[] = [];
				for (const value of next) {
					const validationErrors: string[] | null = validateFn(value);
					if (validationErrors) {
						errors.push(...validationErrors);
					}
				}
				if (errors.length > 0) {
					throw new BadRequestException(errors.join('.\n'));
				}
			}
			val = next;
		};

		Object.defineProperty(target, key, {
			get: getter,
			set: setter,
			enumerable: true,
			configurable: true
		});
	}
}
