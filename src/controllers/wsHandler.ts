import {APIGatewayEvent} from 'aws-lambda';
import {EndpointConstant} from '../constants';
import {errorResponse, okResponse} from '../utils';
import {AssetService} from '../services/asset.service';
import {UserInterface} from '../interfaces';
import {ConnectionService} from '../services/connection.service';
import {AssetType} from '../enums';


const assetService = AssetService.getInstance();
const connectionService = ConnectionService.getInstance();

export const handler = async (event: APIGatewayEvent): Promise<any> => {
	try {
		switch (event.requestContext.routeKey) {
			case EndpointConstant.CONNECT_ROUTE:
				return await addConnection(event);
			case EndpointConstant.DISCONNECT_ROUTE:
				return await removeConnection(event);
			case EndpointConstant.MESSAGE_ROUTE:
				return okResponse(event.requestContext.routeKey);
			case EndpointConstant.DEFAULT_ROUTE:
				return okResponse(event.requestContext.routeKey);
		}
	} catch (err) {
		console.log(JSON.stringify(event));
		return errorResponse(err);
	}
};

const addConnection = async (event: APIGatewayEvent): Promise<any> => {
	const userId: string = event.requestContext.authorizer.principalId;
	const connectionId: string = event.requestContext.connectionId;
	/* Fetch parameter from authorizer's context. Check wsAuthHandler returned object. */
	// const assetId: string = event.requestContext.authorizer.assetId;
	const principal: UserInterface = await assetService.fetchAssetByAssetId(userId, AssetType.USER);
	await connectionService.addConnection(principal, connectionId);
	return okResponse(null);
};

const removeConnection = async (event: APIGatewayEvent): Promise<any> => {
	const connectionId: string = event.requestContext.connectionId;
	const userId: string = event.requestContext.authorizer.principalId;
	await connectionService.removeConnection(userId, connectionId);
	return okResponse(null);
};
