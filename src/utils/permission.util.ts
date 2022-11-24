import {AllowAll, UserRole} from '../enums';

export const PermissionMap: any = {

	/* Users */
	CREATE_USER: [UserRole.ADMIN],
	FETCH_USERS: [UserRole.ADMIN],
	FETCH_USER: [...AllowAll],
	UPDATE_USER: [UserRole.ADMIN],
	DELETE_USER: [UserRole.ADMIN],

	/* Buildings */
	CREATE_BUILDING: [UserRole.ADMIN],
	FETCH_BUILDINGS: [UserRole.ADMIN],
	FETCH_BUILDING: [UserRole.ADMIN],
	UPDATE_BUILDING: [UserRole.ADMIN],
	DELETE_BUILDING: [UserRole.ADMIN],

	/* Systems */
	CREATE_SYSTEM: [UserRole.ADMIN],
	FETCH_SYSTEMS: [UserRole.ADMIN],
	FETCH_SYSTEM: [UserRole.ADMIN],
	UPDATE_SYSTEM: [UserRole.ADMIN],
	DELETE_SYSTEM: [UserRole.ADMIN],

	/* SystemUsers */
	ACTION_SYSTEM_USER: [UserRole.ADMIN],

	/* Commands data */
	ACTION_COMMAND: [...AllowAll],

	/* Optimization data */
	ACTION_OPTI: [...AllowAll],

	/* System data[Process, Status] */
	ACTION_SYSTEM_DATA: [...AllowAll],

	/* Companies */
	CREATE_COMPANY: [UserRole.ADMIN],
	FETCH_COMPANIES: [UserRole.ADMIN, ...CompanyRoles],
	FETCH_COMPANY: [UserRole.ADMIN, ...CompanyRoles],
	UPDATE_COMPANY: [UserRole.ADMIN],
	DELETE_COMPANY: [UserRole.ADMIN],

	/* Farms */
	CREATE_FARM: [UserRole.ADMIN, UserRole.OWNER],
	FETCH_FARMS: [UserRole.ADMIN, ...CompanyRoles],
	FETCH_FARM: [UserRole.ADMIN, ...CompanyRoles],
	UPDATE_FARM: [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER],
	DELETE_FARM: [UserRole.ADMIN, UserRole.OWNER],

	/* Shed */
	CREATE_SHED: [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER],
	FETCH_SHEDS: [UserRole.ADMIN, ...CompanyRoles],
	FETCH_SHED: [UserRole.ADMIN, ...CompanyRoles],
	UPDATE_SHED: [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER],
	DELETE_SHED: [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER],

	/* Devices */
	REGISTER_DEVICES: [UserRole.ADMIN],
	FETCH_DEVICES: [UserRole.ADMIN, ...CompanyRoles, UserRole.CONSULTANT],
	FETCH_DEVICE: [UserRole.ADMIN, ...CompanyRoles, UserRole.CONSULTANT],
	UPDATE_DEVICE: [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER],
	DELETE_DEVICE: [UserRole.ADMIN],
	FETCH_DATA: [UserRole.ADMIN, ...CompanyRoles, UserRole.CONSULTANT],
	SUPPRESS_ALARM: [UserRole.ADMIN, ...CompanyRoles],

	/* Templates */
	CREATE_TEMPLATE: [UserRole.ADMIN, UserRole.OWNER],
	FETCH_TEMPLATES: [UserRole.ADMIN, ...CompanyRoles, UserRole.CONSULTANT],
	FETCH_TEMPLATE: [UserRole.ADMIN, ...CompanyRoles, UserRole.CONSULTANT],
	UPDATE_TEMPLATE: [UserRole.ADMIN, UserRole.OWNER],
	DELETE_TEMPLATE: [UserRole.ADMIN, UserRole.OWNER],

	FETCH_PRINCIPAL: [UserRole.ADMIN, ...CompanyRoles, UserRole.CONSULTANT],

	FETCH_MESSAGES: [UserRole.ADMIN, UserRole.CONSULTANT, UserRole.CONSULTANT],
};
