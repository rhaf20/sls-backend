import { CognitoService } from './cognito.service';
import { DynamoService } from './dynamo.service';
import { UserCreateRequest, UserUpdateRequest } from '../interfaces';
import { UserInterface } from '../interfaces';
import { AccessDeniedException, ResourceNotFoundException } from '../utils';
import { UserType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { UserRole } from '../enums';
import { UserTable } from '../constants';


export class UserService {

	private static instance: UserService;

	private readonly cognito: CognitoService;

	private readonly dynamo: DynamoService;

	private constructor() {
		this.cognito = CognitoService.getInstance();
		this.dynamo = DynamoService.getInstance();
	}

	async createUser(request: UserCreateRequest, principal: UserInterface): Promise<UserInterface> {
		/*
		* If principal is not Admin role, then 403.
		* */
		if (UserRole.ADMIN !== principal.role) {
			throw new AccessDeniedException(`Access denied. Cannot create user with role : ${principal.role}`);
		}

		/* Create user in cognito */
		const userType: UserType = await this.cognito.createUser(request);

		/* Save user in database */
		const user: UserInterface = request.mapUser(userType.Username as string, userType.Enabled);
		await this.dynamo.insert({
			Item: user,
			TableName: UserTable.TABLE_NAME,
			ConditionExpression: `attribute_not_exists(${UserTable.HASH_KEY})`,
			ReturnValues: 'NONE'
		});

		return user;
	}

	async fetchUsers(principal: UserInterface): Promise<UserInterface[]> {
		/*
		* If principal is not admin role, then 403.
		* */
		if (UserRole.ADMIN !== principal.role) {
			throw new AccessDeniedException(`Access denied. Cannot fetch all users with role : ${principal.role}`);
		}

		const users: UserInterface[] = await this.dynamo.query({
			TableName: UserTable.TABLE_NAME,
		});
		return users;
	}

	async fetchUserByUserId(userId: string): Promise<UserInterface> {
		const users: UserInterface[] = await this.dynamo.query({
			TableName: UserTable.TABLE_NAME,
			KeyConditionExpression: `${UserTable.HASH_KEY} = :hashKey`,
			ExpressionAttributeValues: { ':hashKey': userId },
			Limit: 1
		});
		if (users.length === 0) {
			throw new ResourceNotFoundException(`User ${userId} does not exist.`);
		}
		return users[0];
	}

	async fetchUser(principal: UserInterface, userId: string): Promise<UserInterface> {
		/*
		* If principal is not Admin role and requested user id is different, then 403.
		* */
		if (principal.role !== UserRole.ADMIN && principal.id !== userId) {
			throw new AccessDeniedException(`Access denied. Cannot fetch user : ${userId}`);
		}
		
		return await this.fetchUserByUserId(userId);
	}

	async updateUser(principal: UserInterface, userId: string, request: UserUpdateRequest): Promise<UserInterface> {
		/*
		* If principal is not admin role and userId is different, then 403.
		* */
		if (UserRole.ADMIN !== principal.role && userId !== principal.id) {
			throw new AccessDeniedException(`Access denied. Cannot update with role : ${principal.role}`);
		}
		const prevUser: UserInterface = await this.fetchUserByUserId(userId);
		const newUser: UserInterface = request.mapUser(prevUser);

		/* If updating self, then cannot update role. */
		if (principal.id === prevUser.id && prevUser.role !== newUser.role) {
			throw new AccessDeniedException('Access denied. Cannot change own role.');
		}

		/* Update in Cognito. */
		await this.cognito.updateUser(newUser);

		/* Update in database. */
		await this.dynamo.insert({
			Item: newUser,
			TableName: UserTable.TABLE_NAME,
			ConditionExpression: `attribute_exists(${UserTable.HASH_KEY})`,
			ReturnValues: 'NONE'
		});

		return newUser;
	}

	async deleteUser(userId: string, principal: UserInterface): Promise<UserInterface> {
		/*
		* If principal is not Admin role, then 403.
		* */
		if (UserRole.ADMIN !== principal.role) {
			throw new AccessDeniedException(`Access denied. Cannot delete user with role : ${principal.role}`);
		}

		/*
		* Cannot delete self. Access denied.
		* */
		if (principal.id === userId) {
			throw new AccessDeniedException('Access denied. Cannot delete self.');
		}

		/* Fetch user from database */
		const user: UserInterface = await this.fetchUser(principal, userId);

		/* Delete user from database */
		await this.dynamo.delete({
			TableName: UserTable.TABLE_NAME,
			Key: { id: user.id, role: user.role },
			ReturnValues: "ALL_OLD"
		});

		/* Delete user in Cognito */
		await this.cognito.deleteUser(user.id);

		return user;
	}

	async fetchPrincipal(userId: string): Promise<UserInterface> {
		return await this.fetchUserByUserId(userId);
	}

	static getInstance(): UserService {
		if (!UserService.instance) {
			UserService.instance = new UserService();
		}
		return UserService.instance;
	}
}
