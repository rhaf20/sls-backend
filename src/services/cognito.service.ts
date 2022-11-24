import { AWSError, CognitoIdentityServiceProvider } from 'aws-sdk';
import {
	AdminCreateUserResponse,
	AdminUpdateUserAttributesResponse,
	AttributeListType,
	ListUsersResponse,
	UsersListType,
	UserType
} from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { UserCreateRequest, UserInterface } from '../interfaces';
import { getSecret } from '../utils/ssm.util';

const INVALID_PARAMETER_EXCEPTION = 'InvalidParameterException';
const USERNAME_EXISTS_EXCEPTION = 'UsernameExistsException';

export class CognitoService {

	private static instance: CognitoService;

	private cognitoProvider: CognitoIdentityServiceProvider;

	private temporaryPassword: string;
	private userPoolId: string;

	private constructor() {
	}

	async initCognitoProvider() {
		this.temporaryPassword = await getSecret("COGNITO_TEMP_PASSWORD");
		this.userPoolId = await getSecret("COGNITO_USER_POOL_ID");
		const region = await getSecret("REGION");

		this.cognitoProvider = new CognitoIdentityServiceProvider({
			apiVersion: '2016-04-18',
			region
		});
	}

	async createUser(userRequest: UserCreateRequest): Promise<UserType> {
		await this.initCognitoProvider();
		const attributes: AttributeListType = [
			{ Name: 'email', Value: userRequest.email },
			{ Name: 'name', Value: userRequest.firstName },
			{ Name: 'family_name', Value: userRequest.lastName },
			{ Name: 'custom:role', Value: userRequest.role },
			{ Name: 'custom:enabled', Value: userRequest.enabled ? '1' : '0' },
			{ Name: 'email_verified', Value: 'true' },
			{ Name: 'phone_number_verified', Value: 'true' }
		];
		return new Promise<UserType>(async (resolve, reject) => {
			await this.cognitoProvider.adminCreateUser({
				DesiredDeliveryMediums: ['EMAIL'],
				MessageAction: 'SUPPRESS',
				TemporaryPassword: this.temporaryPassword,
				UserAttributes: attributes,
				Username: userRequest.email.trim(),
				UserPoolId: this.userPoolId
			}, (err: AWSError, data: AdminCreateUserResponse) => {
				if (err) {
					let _err: AWSError | Error = err;
					if (USERNAME_EXISTS_EXCEPTION === err.code) {
						_err = new UsernameExistsException('Email is already registered.')
					} else if (INVALID_PARAMETER_EXCEPTION === err.code) {
						_err = new InvalidParameterException(err.message);
					}
					return reject(_err);
				}
				resolve(data.User);
			});
		});
	}

	async fetchUsers(): Promise<UsersListType> {
		await this.initCognitoProvider();
		return new Promise<UsersListType>(async (resolve, reject) => {
			await this.cognitoProvider.listUsers({
				UserPoolId: this.userPoolId
			}, (err: AWSError, data: ListUsersResponse) => {
				if (err) {
					return reject(err);
				}
				resolve(data.Users);
			})
		});
	}

	async updateUser(user: UserInterface): Promise<UserType> {
		await this.initCognitoProvider();
		return new Promise<UserType>(async (resolve, reject) => {
			const attributes: AttributeListType = [
				{ Name: 'email', Value: user.email },
				{ Name: 'name', Value: user.name },
				{ Name: 'family_name', Value: user.lastName },
				{ Name: 'custom:role', Value: user.role },
				{ Name: 'custom:enabled', Value: user.enabled ? '1' : '0' },
			];
			await this.cognitoProvider.adminUpdateUserAttributes({
				UserAttributes: attributes,
				Username: user.id,
				UserPoolId: this.userPoolId
			}, (err: AWSError, data: AdminUpdateUserAttributesResponse) => {
				if (err) {
					let _err: AWSError | Error = err;
					if (INVALID_PARAMETER_EXCEPTION === err.code) {
						_err = new InvalidParameterException(err.message);
					}
					return reject(_err);
				}
				resolve(data);
			});
		});
	}

	async deleteUser(username: string): Promise<any> {
		await this.initCognitoProvider();
		return new Promise(async (resolve, reject) => {
			await this.cognitoProvider.adminDeleteUser({
				Username: username,
				UserPoolId: this.userPoolId
			}, (err: AWSError, data: {}) => {
				if (err) {
					return reject(err);
				}
				resolve(data);
			})
		});
	}

	static getInstance(): CognitoService {
		if (!CognitoService.instance) {
			CognitoService.instance = new CognitoService();
		}
		return CognitoService.instance;
	}
}

export class UsernameExistsException extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, UsernameExistsException.prototype);
	}
}

export class InvalidParameterException extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, InvalidParameterException.prototype);
	}
}
