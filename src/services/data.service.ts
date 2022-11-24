import {TimeseriesService} from './timeseries.service';
import {AlarmInterface, DataPoint, DataSeries, DeviceInterface, MessageLog, UserInterface} from '../interfaces';
import {DeviceService} from './device.service';
import {hasKey} from '../utils';

export class DataService {

	private static instance: DataService;

	private readonly deviceService: DeviceService;
	private readonly tsService: TimeseriesService;

	private constructor() {
		this.deviceService = DeviceService.getInstance();
		this.tsService = TimeseriesService.getInstance();
	}

	async fetchAlarmData(principal: UserInterface, deviceId: string, startTime: number,
	                      endTime: number): Promise<AlarmInterface[]> {
		await this.deviceService.fetchDeviceByDeviceId(principal, deviceId);
		const alarms: AlarmInterface[] = await this.tsService.fetchAlarmData(deviceId, startTime, endTime);
		return alarms;
	}

	async fetchSensorData(principal: UserInterface, deviceId: string, start: number, end: number): Promise<DataSeries> {
		/* Validate that user has access to the device. */
		const device: DeviceInterface = await this.deviceService.fetchDeviceByDeviceId(principal, deviceId);

		const points: DataPoint[] = await this.tsService.fetchRawData(deviceId, start, end);
		return {
			deviceId,
			shedId: device.shedId,
			farmId: device.farmId,
			companyId: device.companyId,
			points
		};
	}

	async fetchMessageLog(principal: UserInterface, deviceId: string, startTime: number,
	                      endTime: number): Promise<MessageLog[]> {
		await this.deviceService.fetchDeviceByDeviceId(principal, deviceId);
		const messages: MessageLog[] = await this.tsService.fetchMessageLog(deviceId, startTime, endTime);
		return messages.map((message: MessageLog) => {
			if (hasKey(message, 'state')) {
				message.message = JSON.stringify(message.state);
				delete message.state;
			}
			return message;
		});
	}

	static getInstance(): DataService {
		if (!DataService.instance) {
			DataService.instance = new DataService();
		}
		return DataService.instance;
	}
}
