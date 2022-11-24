import {UserInterface} from '../user.interface';
import {Enumed, NotBlank} from '../../decorators';
import {deepClone} from '../../utils';
import {ValidatorUtil as vu} from '../../utils/validator.util';
import {UserRole} from '../../enums';


export class UserCreateRequest {

	company: string;
	note: string;

	@NotBlank()
	firstName: string;

	@NotBlank()
	lastName: string;

	@NotBlank()
	email: string;

	@Enumed(UserRole, false)
	role: UserRole;

	@NotBlank()
	enabled: boolean;

	constructor(payload: string) {
		const request: UserCreateRequest = JSON.parse(payload);
		this.email = request.email;
		this.firstName = request.firstName;
		this.lastName = request.lastName;
		this.role = request.role;
		this.enabled = true;
		this.company = request.company;
		this.note = request.note;
	}

	mapUser(userId: string, enabled: boolean): UserInterface {
		const timestamp: number = Date.now();
		return {
			id: userId,
			name: this.firstName,
			lastName: this.lastName,
			email: this.email,
			role: this.role,
			enabled,
			company: this.company,
			note: this.note,
			systems: [],
			createdAt: timestamp,
			updatedAt: timestamp
		};
	}
}

export class UserUpdateRequest {

	firstName: string;
	lastName: string;
	enabled: boolean;
	company: string;
	note: string;
	systems: string[];

	@Enumed(UserRole, true)
	role: UserRole;

	constructor(payload: string) {
		const request: UserUpdateRequest = JSON.parse(payload);
		this.firstName = request.firstName;
		this.lastName = request.lastName;
		this.enabled = request.enabled;
		this.role = request.role;
		this.company = request.company;
		this.note = request.note;
		this.systems = request.systems;
	}

	mapUser(prevUser: UserInterface): UserInterface {
		const user: UserInterface = deepClone(prevUser);
		if (vu.notBlank(this.firstName)) {
			user.name = this.firstName;
		}
		if (vu.notBlank(this.lastName)) {
			user.lastName = this.lastName;
		}
		if (vu.notNull(this.enabled)) {
			user.enabled = this.enabled;
		}
		if (vu.notNull(this.role)) {
			user.role = this.role;
		}
		if (vu.notBlank(this.company)) {
			user.company = this.company;
		}
		if (vu.notBlank(this.note)) {
			user.note = this.note;
		}
		if (vu.notEmpty(this.systems)) {
			user.systems = this.systems;
		}
		user.updatedAt = Date.now();
		return user;
	}
}
