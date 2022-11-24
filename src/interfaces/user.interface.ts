import { UserRole } from '../enums';

export interface UserInterface {
	id: string;
	name: string;
	lastName: string;
	email: string;
	role: UserRole;
	enabled: boolean;
	company?: string;
	note?: string;
	systems?: string[];
	createdAt: number;
	updatedAt: number;
}
