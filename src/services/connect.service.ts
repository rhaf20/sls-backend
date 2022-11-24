import {AWSError, Connect} from 'aws-sdk';
import {StartOutboundVoiceContactResponse} from 'aws-sdk/clients/connect';
import { getSecret } from '../utils/ssm.util';


export class ConnectService {

	private static instance: ConnectService;

	private connect: Connect;

	private contactFlowId: string;
	private instanceId: string;
	private queueId: string;

	private constructor() {
	}

	async initConnectService() {
		const region = await getSecret("REGION");
		this.connect = new Connect({
			region
		});
		this.contactFlowId = await getSecret("CONNECT_CONTACT_FLOW_ID");
		this.instanceId = await getSecret("CONNECT_INSTANCE_ID");
		this.queueId = await getSecret("CONNECT_QUEUE_ID");
	}

	initiateOutgoingCall(phoneNumber: string, attributes: any): Promise<any> {
		return new Promise(async (resolve) => {
			await this.initConnectService();
			await this.connect.startOutboundVoiceContact({
				Attributes: attributes,
				ContactFlowId: this.contactFlowId,
				DestinationPhoneNumber: phoneNumber,
				InstanceId: this.instanceId,
				QueueId: this.queueId,
			}, (err: AWSError, data: StartOutboundVoiceContactResponse) => {
				if (err) {
					throw err;
				}
				resolve(data);
			});
		});
	}

	static getInstance(): ConnectService {
		if (!ConnectService.instance) {
			ConnectService.instance = new ConnectService();
		}
		return ConnectService.instance;
	}
}
