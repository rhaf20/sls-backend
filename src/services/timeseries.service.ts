import { DynamoService } from './dynamo.service';
import { AlarmTable, MessageLogTable, TimeseriesTable } from '../constants';
import { AlarmInterface, DataPoint, MessageInterface, MessageLog } from '../interfaces';
import { deepClone } from '../utils';

export class TimeseriesService {

	private static instance: TimeseriesService;

	private readonly dynamo: DynamoService;

	private constructor() {
		this.dynamo = DynamoService.getInstance();
	}

	async insertPoints(data: DataPoint[]) {
		return await this.dynamo.insertBatch(data, TimeseriesTable.TABLE_NAME);
	}

	async fetchAlarmData(deviceId: string, start: number, end: number): Promise<AlarmInterface[]> {
		return await this.dynamo.query({
			TableName: AlarmTable.TABLE_NAME,
			IndexName: AlarmTable.DEVICE_GSI_NAME,
			KeyConditionExpression: `${AlarmTable.DEVICE_GSI_HASH} = :hashKey AND #${AlarmTable.SORT_KEY} BETWEEN :start AND :end`,
			ExpressionAttributeNames: { [`#${AlarmTable.SORT_KEY}`]: 'timestamp' },
			ExpressionAttributeValues: { ':hashKey': deviceId, ':start': start, ':end': end }
		});
	}

	async fetchRawData(deviceId: string, start: number, end: number): Promise<DataPoint[]> {
		return await this.dynamo.query({
			TableName: TimeseriesTable.TABLE_NAME,
			KeyConditionExpression: `${TimeseriesTable.HASH_KEY} = :hashKey AND #${TimeseriesTable.SORT_KEY} BETWEEN :start AND :end`,
			ExpressionAttributeNames: { [`#${TimeseriesTable.SORT_KEY}`]: 'timestamp' },
			ExpressionAttributeValues: { ':hashKey': deviceId, ':start': start, ':end': end }
		});
	}

	/* MessageLog */
	async fetchMessageLog(deviceId: string, start: number, end: number): Promise<MessageLog[]> {
		return await this.dynamo.query({
			TableName: MessageLogTable.TABLE_NAME,
			KeyConditionExpression: `${MessageLogTable.HASH_KEY} = :hashKey AND #${MessageLogTable.SORT_KEY} BETWEEN :start AND :end`,
			ExpressionAttributeNames: { [`#${MessageLogTable.SORT_KEY}`]: 'timestamp' },
			ExpressionAttributeValues: { ':hashKey': deviceId, ':start': start, ':end': end }
		});
	}

	async logMessage(deviceId: string, message: MessageInterface): Promise<any> {
		const _message: MessageInterface = deepClone(message);
		delete _message.timestamp;
		delete _message.topic;
		const data: any = {
			assetId: deviceId,
			timestamp: message.timestamp,
			message: JSON.stringify(_message)
		};
		return await this.dynamo.insert({
			Item: data,
			TableName: MessageLogTable.TABLE_NAME,
			ReturnValues: 'NONE'
		});
	};

	static getInstance(): TimeseriesService {
		if (!TimeseriesService.instance) {
			TimeseriesService.instance = new TimeseriesService();
		}
		return TimeseriesService.instance;
	}
}
