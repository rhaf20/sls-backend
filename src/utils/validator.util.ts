import { AccessDeniedException, BadRequestException } from './response.util';
import { ApiConstant } from '../constants';
import { APIGatewayEvent } from 'aws-lambda';
import { UserInterface } from '../interfaces';
import { hasKey } from './index';
import { PermissionMap } from './permission.util';

export class ValidatorUtil {

	static validateStringPattern(str: string, format: string | RegExp): boolean {
		if (!str) {
			return false;
		}
		const regex = new RegExp(format);
		return regex.test(str);
	}

	static validateParam(params: any, param: string, isRequired: boolean, format: string | RegExp): string {
		const value: string = params ? params[param] : null;
		if (value) {
			if (format && !this.validateStringPattern(value, format)) {
				throw new BadRequestException(`${ApiConstant.INVALID_PARAM} : ${param}`);
			}
		} else {
			if (isRequired) {
				throw new BadRequestException(`${ApiConstant.MISSING_PARAM} : ${param}`);
			}
		}
		return value;
	}

	/**
	 * Validates whether principal belongs to the authorised user roles.
	 *
	 * @param event
	 * @param permissionKey
	 *
	 * @returns true, if principal is authorised
	 * @throws Error
	 */
	static validatePrincipal(event: APIGatewayEvent, permissionKey: string): UserInterface {
		if (hasKey(event, 'requestContext.authorizer.claims.custom:role')) {
			const claims = event.requestContext.authorizer.claims;
			const roles = PermissionMap[permissionKey];
			if (roles && roles.includes(claims['custom:role'])) {
				return {
					id: claims['cognito:username'],
					name: claims.name,
					lastName: claims.family_name,
					email: claims.email,
					role: claims['custom:role'],
					enabled: claims['custom:enabled'] === '1',
					createdAt: undefined,
					updatedAt: undefined
				};
			}
		}
		throw new AccessDeniedException('Access denied.');
	};

	/**
	 * Validate that object is defined.
	 *
	 * @param value
	 */
	static notNull(value: any): boolean {
		return value !== undefined && value !== null;
	}

	/**
	 * Validate that string is not-null and not-blank.
	 *
	 * @param value
	 */
	static notBlank(value: string): boolean {
		return this.notNull(value) && value.trim().length > 0;
	}

	/**
	 * Validate that array is not-null and not-empty.
	 *
	 * @param values
	 */
	static notEmpty(values: any[]): boolean {
		return this.notNull(values) && values.length > 0;
	};

	/**
	 * Validate that object is null, undefined or blank.
	 *
	 * @param value
	 */
	static isBlank(value: string): boolean {
		return value === undefined || value === null || value.trim().length === 0;
	}

	/**
	 * Validate that object is null, undefined or empty.
	 *
	 * @param value
	 */
	static isEmpty(value: any[]): boolean {
		return value === undefined || value === null || value.length === 0;
	}

	/**
	 * Validate that object is null or undefined.
	 *
	 * @param value
	 */
	static isNull(value: any): boolean {
		return value === undefined || value === null;
	}

	/**
	 * Checks whether the given array is undefined, null or empty.
	 *
	 * @param arr
	 */
	static isNullOrBlank(arr: any[]): boolean {
		return !arr || arr.length === 0;
	};

	static compareStringArray(array1: string[], array2: string[]): boolean {
		if (array1.length !== array2.length) {
			return false;
		}
		for (let i = 0; i < array1.length; i++) {
			if (array1[i] !== array2[i]) {
				return false;
			}
		}
		return true;
	};
}
