import * as uuid from 'uuid';
import {FarmInterface, UserInterface} from '../interfaces';
import {AccessDeniedException, BadRequestException} from './response.util';
import {CompanyRoles, UserRole} from '../enums';

export * from './alarm.util';
export * from './datetime.util';
export * from './permission.util';
export * from './response.util';


/**
 * Verifies if the object contains the given path.
 *
 * @param obj: object
 * @param path: 'address.state.country'
 */
export const hasKey = (obj: any, path: string): boolean => {
	return path.split(".").every(function (x) {
		if (typeof obj !== 'object' || obj === null || !(x in obj))
			return false;
		obj = obj[x];
		return true;
	});
};

/**
 * Generate and return UUID v4.
 */
export const generateUUID = (): string => {
	return uuid.v4();
};

export const deepClone = <T>(obj: T): T => {
	return JSON.parse(JSON.stringify(obj));
};

export const capitalise = (str: string): string => {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Remove duplicates from string array.
 *
 * @param strArray
 */
export const removeDuplicates = (strArray: string[]): string[] => {
	return Array.from(new Set(strArray));
};

/**
 * Validates whether user is assigned to farm.
 *
 * @param farm
 * @param userId
 */
export const validateFarmAccess = (farm: FarmInterface, userId: string): boolean => {
	if (farm.users && farm.users.includes(userId)) {
		return true;
	}
	throw new AccessDeniedException(`Access denied. Cannot fetch farm ${farm.assetId}`);
};

/**
 * Validates whether requested user ids are part of the company users.
 *
 * @param companyUsers
 * @param requestUserIds
 */
export const validateUsersByCompany = (requestUserIds: string[], companyUsers: UserInterface[]): boolean => {
	const companyUserIds: string[] = companyUsers.filter((user: UserInterface) => CompanyRoles.includes(user.role))
		.map((user: UserInterface) => user.assetId);
	const invalidUserIds: string[] = requestUserIds.filter((userId: string) => !companyUserIds.includes(userId));
	if (invalidUserIds.length > 0) {
		throw new BadRequestException(`Invalid user ids : ${invalidUserIds.join(', ')}`);
	}
	return true;
};

export const hasFarmAccess = (farm: FarmInterface, user: UserInterface): boolean => {
	let result: boolean = false;
	switch (user.role) {
		case UserRole.ADMIN:
			result = true;
			break;
		case UserRole.OWNER:
			result = farm.companyId === user.companyId;
			break;
		case UserRole.MANAGER:
			result = farm.users && farm.users.includes(user.assetId);
			break;
	}
	if (result) {
		return result;
	}
	throw new AccessDeniedException(`Access denied. Cannot access farm ${farm.assetId}`);
};

/**
 * Returns true if objects are equal, returns false if the objects are unequal.
 *
 * @param obj1
 * @param obj2
 */
export const compareObjects = (obj1: any, obj2: any): boolean => {
	return JSON.stringify(obj1) === JSON.stringify(obj2);
};

/**
 * Returns last element of the array.
 *
 * @param items
 */
export const getLastElement = (items: any[]): any => {
	if (!items || items.length === 0) {
		return undefined;
	}
	return items[items.length - 1];
};
