import { APIGatewayEvent } from 'aws-lambda';
import { InvalidParameterException, UsernameExistsException } from '../services/cognito.service';
import { badRequestResponse, errorResponse, notFoundResponse, okResponse } from '../utils';
import { ApiConstant, EndpointConstant, RegexConstant } from '../constants';
import { UserInterface } from '../interfaces';
import { ValidatorUtil as vu } from '../utils/validator.util';
import { UserCreateRequest, UserUpdateRequest } from '../interfaces';
import { UserService } from '../services/user.service';


const userService = UserService.getInstance();

export const handler = async (event: APIGatewayEvent): Promise<any> => {
	try {
		switch (event.resource) {
			case EndpointConstant.USER_ENDPOINT:
				if (event.httpMethod === 'GET') {
					return await fetchUsers(event);
				} else if (event.httpMethod === 'POST') {
					return await createUser(event);
				}
				break;
			case EndpointConstant.USER_DETAIL_ENDPOINT:
				if (event.httpMethod === 'GET') {
					return await fetchUserByUserId(event);
				} else if (event.httpMethod === 'PUT') {
					return await updateUser(event);
				} else if (event.httpMethod === 'DELETE') {
					return await deleteUser(event);
				}
				break;
		}
		return notFoundResponse(`Resource not found : [${event.httpMethod}] ${event.resource}`);
	} catch (err) {
		console.log(JSON.stringify(event));
		/* Cognito exception */
		if (err instanceof UsernameExistsException) {
			console.error(err.stack);
			return badRequestResponse(err.message);
		}
		/* Cognito exception */
		if (err instanceof InvalidParameterException) {
			console.error(err.stack);
			return badRequestResponse(err.message);
		}
		return errorResponse(err);
	}
};

const createUser = async (event: APIGatewayEvent): Promise<UserInterface> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'CREATE_USER');
	const request: UserCreateRequest = new UserCreateRequest(event.body);
	const user: UserInterface = await userService.createUser(request, principal);
	return okResponse(user);
};

const fetchUsers = async (event: APIGatewayEvent): Promise<any> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_USERS');
	const users: UserInterface[] = await userService.fetchUsers(principal);
	return okResponse(users);
};

const fetchUserByUserId = async (event: APIGatewayEvent): Promise<any> => {
	const userId: string = vu.validateParam(event.pathParameters, ApiConstant.USER_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_USER');
	const user: UserInterface = await userService.fetchUser(principal, userId);
	return okResponse(user);
};

const updateUser = async (event: APIGatewayEvent): Promise<any> => {
	const userId: string = vu.validateParam(event.pathParameters, ApiConstant.USER_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'UPDATE_USER');
	const request: UserUpdateRequest = new UserUpdateRequest(event.body);
	const user: UserInterface = await userService.updateUser(principal, userId, request);
	return okResponse(user);
};

const deleteUser = async (event: APIGatewayEvent): Promise<any> => {
	const userId: string = vu.validateParam(event.pathParameters, ApiConstant.USER_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'DELETE_USER');
	const user: UserInterface = await userService.deleteUser(userId, principal);
	return okResponse(user);
};
