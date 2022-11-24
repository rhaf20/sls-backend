import {DynamoService} from './dynamo.service';
import {AlarmInterface} from '../interfaces';
import {AlarmTable} from '../constants';
import {IotService} from './iot.service';
import {DesiredInterface} from '../interfaces/shadow.interface';

export class AlarmService {

	private static instance: AlarmService;

	private readonly dynamo: DynamoService;
	private readonly iotService: IotService;

	private constructor() {
		this.dynamo = DynamoService.getInstance();
		this.iotService = IotService.getInstance();
	}

	async createAlarm(alarm: AlarmInterface): Promise<any> {
		return await this.dynamo.insert({
			Item: alarm,
			TableName: AlarmTable.TABLE_NAME,
			ReturnValues: 'NONE'
		});
	}

	async fetchAlarmByAlarmId(alarmId: string): Promise<AlarmInterface> {
		return await this.dynamo.query({
			TableName: AlarmTable.TABLE_NAME,
			KeyConditionExpression: `${AlarmTable.HASH_KEY} = :hashKey`,
			ExpressionAttributeValues: {':hashKey': alarmId}
		});
	}

	async fetchLastDeviceAlarm(deviceId: string): Promise<AlarmInterface> {
		const alarms: AlarmInterface[] = await this.dynamo.query({
			TableName: AlarmTable.TABLE_NAME,
			IndexName: AlarmTable.DEVICE_GSI_NAME,
			KeyConditionExpression: `${AlarmTable.DEVICE_GSI_HASH} = :hashKey`,
			ExpressionAttributeValues: {':hashKey': deviceId},
			ScanIndexForward: true,
			Limit: 1
		});
		if (alarms.length > 0) {
			return alarms[0];
		}
	}

	async updateAlarm(alarm: AlarmInterface): Promise<any> {
		return await this.dynamo.insert({
			Item: alarm,
			TableName: AlarmTable.TABLE_NAME,
			ReturnValues: 'NONE'
		});
	}

	async suppressAlarm(deviceId: string): Promise<void> {
		const payload: { state: { desired: Partial<DesiredInterface> } } = {state: {desired: {inh: [1, 1]}}};
		await this.iotService.updateDeviceShadow(deviceId, payload);
	}

	static getInstance(): AlarmService {
		if (!AlarmService.instance) {
			AlarmService.instance = new AlarmService();
		}
		return AlarmService.instance;
	}
}
