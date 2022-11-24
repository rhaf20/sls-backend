import ApiGatewayManagementApi from 'aws-sdk/clients/apigatewaymanagementapi';
import { ConnectionService } from './connection.service';
import { UserRole } from '../enums';
import { ConnectionInterface, DeviceInterface, FarmInterface, WSMessage } from '../interfaces';
import { getSecret } from '../utils/ssm.util';


export class ApiService {

	private static instance: ApiService;

	private apiClient: ApiGatewayManagementApi;

	private connectionService: ConnectionService;

	private constructor() {
	}

	async initApiService() {
		const endpoint = await getSecret("WSS_ENDPOINT");
		const region = await getSecret("REGION");
		this.apiClient = new ApiGatewayManagementApi({
			apiVersion: '2018-11-29',
			endpoint,
			region
		});
		this.connectionService = ConnectionService.getInstance();
	}

	async sendMessage(device: DeviceInterface, farm: FarmInterface, messages: WSMessage[]): Promise<any> {
		await this.initApiService();
		try {
			const connections: ConnectionInterface[] = await this.connectionService.fetchConnections();

			const promises = connections.filter((connection: ConnectionInterface) => {
				switch (connection.role) {
					case UserRole.ADMIN:
						return true;
					case UserRole.OWNER:
						return device.companyId === connection.companyId;
					case UserRole.MANAGER:
						return farm.users && farm.users.includes(connection.userId);
					case UserRole.CONSULTANT:
						return connection.devices.includes(device.assetId);
				}
				return false;
			}).map((connection) => this.apiClient.postToConnection({
				ConnectionId: connection.connectionId,
				Data: JSON.stringify(messages)
			}).promise());
			if (promises.length > 0) {
				await Promise.all(promises);
			}
		} catch (err) {
			console.error(err.message);
		}
	}

	static getInstance(): ApiService {
		if (!ApiService.instance) {
			ApiService.instance = new ApiService();
		}
		return ApiService.instance;
	}
}
