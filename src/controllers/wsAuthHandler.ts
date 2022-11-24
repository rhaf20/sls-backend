import {unauthorisedResponse} from '../utils';
import {APIGatewayRequestAuthorizerEvent} from 'aws-lambda';

export const handler = async (event: APIGatewayRequestAuthorizerEvent, context: any, callback: any): Promise<any> => {

	const token: string = event.queryStringParameters.Authorization;
	if (!token) {
		console.error('Unauthorised. Token is missing');
		callback(null, unauthorisedResponse('Unauthorized'));
	}

	const payload: any = decodeJWTToken(token);
	/*if (Date.now() >= payload.exp * 1000) {
		callback(null, unauthorisedResponse('Token has expired.'));
	}*/

	return {
		principalId: payload['cognito:username'],
		policyDocument: {
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'execute-api:Invoke',
					Effect: 'Allow',
					Resource: event.methodArn
				}
			]
		},
		context: {}
	};
};

const decodeJWTToken = (token: string): any => {
	const base64Url = token.split('.')[1];
	return JSON.parse(Buffer.from(base64Url, 'base64').toString());
};
