export enum UserRole {
	ADMIN = 'ADMIN',
	TECH = 'TECH',
	USER = 'USER',
}


export const AllowAll: UserRole[] = [UserRole.ADMIN, UserRole.TECH, UserRole.USER];