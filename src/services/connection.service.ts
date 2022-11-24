import {DynamoService} from './dynamo.service';
import {ConnectionTable} from '../constants';
import {AssetService} from './asset.service';
import {ConnectionInterface, UserInterface} from '../interfaces';
import {UserRole} from '../enums';

export class ConnectionService {

	private static instance: ConnectionService;

	private readonly assetService: AssetService;
	private readonly dynamo: DynamoService;

	private constructor() {
		this.assetService = AssetService.getInstance();
		this.dynamo = DynamoService.getInstance();
	}

	async addConnection(principal: UserInterface, connectionId: string) {
		const connection: ConnectionInterface = await this.getConnectionObject(principal, connectionId);
		return await this.dynamo.insert({
			Item: connection,
			TableName: ConnectionTable.TABLE_NAME,
			ConditionExpression: `attribute_not_exists(${ConnectionTable.HASH_KEY})`,
			ReturnValues: 'NONE'
		});
	}

	async removeConnection(userId: string, connectionId: string) {
		return await this.dynamo.delete({
			TableName: ConnectionTable.TABLE_NAME,
			Key: {userId, connectionId},
			ReturnValues: 'NONE'
		});
	}

	async fetchConnections(cType: string = 'WS'): Promise<ConnectionInterface[]> {
		return await this.dynamo.query({
			TableName: ConnectionTable.TABLE_NAME,
			IndexName: ConnectionTable.TYPE_GSI_NAME,
			KeyConditionExpression: `${ConnectionTable.TYPE_GSI_HASH} = :hashKey`,
			ExpressionAttributeValues: {':hashKey': cType},
		});
	}

	async getConnectionsByUserId(userId: string): Promise<ConnectionInterface[]> {
		return await this.dynamo.query({
			TableName: ConnectionTable.TABLE_NAME,
			KeyConditionExpression: `${ConnectionTable.HASH_KEY} = :hashKey`,
			ExpressionAttributeValues: {':hashKey': userId}
		});
	}

	private async getConnectionObject(principal: UserInterface, connectionId: string): Promise<ConnectionInterface> {
		const connection: ConnectionInterface = {
			cType: 'WS',
			connectionId,
			role: principal.role,
			userId: principal.assetId
		};
		if (principal.companyId) {
			connection.companyId = principal.companyId;
		} else if (UserRole.CONSULTANT === principal.role) {
			// TODO : Add devices for consultant
			// connection.devices = await this.assetService.fetchAssetsByFarm(AssetType.PREFERENCE, principal.assetId);
		}
		return connection;
	}

	static getInstance(): ConnectionService {
		if (!ConnectionService.instance) {
			ConnectionService.instance = new ConnectionService();
		}
		return ConnectionService.instance;
	}
}
