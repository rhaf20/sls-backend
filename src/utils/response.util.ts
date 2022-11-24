export class BadRequestException extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, BadRequestException.prototype);
	}
}

export class AccessDeniedException extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, AccessDeniedException.prototype);
	}
}

export class ResourceNotFoundException extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
	}
}

export class ResourceAlreadyExistsException extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, ResourceAlreadyExistsException.prototype);
	}
}


const getHeaders = (): any => {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Credentials': true,
	};
};

export const okResponse = (body: any): any => {
	const response: any = {
		statusCode: 200,
		headers: getHeaders(),
	};
	if (body) {
		response['body'] = JSON.stringify(body);
	}
	return response;
};

export const badRequestResponse = (message: string): any => {
	return {
		statusCode: 400,
		body: JSON.stringify({
			error: {
				code: 400,
				message: message
			}
		}),
		headers: getHeaders(),
	};
};

export const unauthorisedResponse = (message = 'Unauthorised'): any => {
	return {
		statusCode: 401,
		body: JSON.stringify({
			error: {
				code: 401,
				message
			}
		}),
		headers: getHeaders(),
	};
};

export const accessDeniedResponse = (message = 'Access denied'): any => {
	return {
		statusCode: 403,
		body: JSON.stringify({
			error: {
				code: 403,
				message
			}
		}),
		headers: getHeaders(),
	};
};

export const notFoundResponse = (message = 'Resource not found'): any => {
	return {
		statusCode: 404,
		body: JSON.stringify({
			error: {
				code: 404,
				message
			}
		}),
		headers: getHeaders(),
	};
};

export const internalServerError = (message = 'Something went wrong'): any => {
	return {
		statusCode: 500,
		body: JSON.stringify({
			error: {
				code: 500,
				message
			}
		}),
		headers: getHeaders(),
	};
};

export const errorResponse = (err: any): any => {
	console.error(err.stack);
	if (err instanceof BadRequestException) {
		return badRequestResponse(err.message);
	}
	if (err instanceof AccessDeniedException) {
		return accessDeniedResponse(err.message);
	}
	if (err instanceof ResourceNotFoundException) {
		return notFoundResponse(err.message);
	}
	return internalServerError('Something went wrong. Please contact support.');
};
