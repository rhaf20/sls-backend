import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import * as IotData from 'aws-sdk/clients/iotdata';
import { GetThingShadowResponse, UpdateThingShadowResponse } from 'aws-sdk/clients/iotdata';
import Iot, { CreateThingResponse, DeleteThingResponse, DescribeThingResponse } from 'aws-sdk/clients/iot';
import { getSecret } from '../utils/ssm.util';


export class IotService {

	private static instance: IotService;

	private iotData: IotData;
	private iot: Iot;

	private constructor() {
	}

	async initIoTService() {
		const endpoint = await getSecret("IOT_ENDPOINT");
		const region = await getSecret("REGION");

		this.iotData = new AWS.IotData({
			endpoint,
			region,
		});

		this.iot = new AWS.Iot({
			endpoint: `iot.${region}.amazonaws.com`,
			region,
		});
	}

	publish(topic: string, message: any) {
		return new Promise(async (resolve, reject) => {
			await this.initIoTService();
			await this.iotData.publish({
				topic,
				qos: 1,
				payload: JSON.stringify(message)
			}, (err: AWSError, data: {}) => {
				if (err) {
					return reject(err);
				}
				resolve(data);
			})
		});
	}

	fetchDeviceShadow(thingName: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			await this.initIoTService();
			await this.iotData.getThingShadow({
				thingName
			}, (err: AWSError, data: GetThingShadowResponse) => {
				if (err) {
					return reject(err);
				}
				resolve(data.payload);
			});
		});
	}

	updateDeviceShadow(thingName: string, payload: object): Promise<any> {
		return new Promise(async (resolve, reject) => {
			await this.initIoTService();
			await this.iotData.updateThingShadow({
				thingName,
				payload: JSON.stringify(payload)
			}, (err: AWSError, data: UpdateThingShadowResponse) => {
				if (err) {
					return reject(err);
				}
				resolve(data.payload);
			});
		});
	}

	async fetchThingWrapper(thingName: string): Promise<DescribeThingResponse> {
		try {
			await this.initIoTService();
			return await this.fetchThing(thingName);
		} catch (err) {
			return null;
		}
	}

	fetchThing(thingName: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			await this.initIoTService();
			await this.iot.describeThing({
				thingName
			}, (err: AWSError, data: DescribeThingResponse) => {
				if (err) {
					return reject(err);
				}
				resolve(data);
			});
		});
	}

	createThing(thingName: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			await this.initIoTService();
			await this.iot.createThing({
				thingName
			}, (err: AWSError, data: CreateThingResponse) => {
				if (err) {
					return reject(err);
				}
				resolve(data);
			});
		});
	}

	deleteThing(thingName: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			await this.initIoTService();
			await this.iot.deleteThing({
				thingName
			}, (err: AWSError, data: DeleteThingResponse) => {
				if (err) {
					return reject(err);
				}
				resolve(data);
			})
		});
	}

	static getInstance(): IotService {
		if (!IotService.instance) {
			IotService.instance = new IotService();
		}
		return IotService.instance;
	}
}
