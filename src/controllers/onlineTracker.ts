import {ScheduledEvent} from 'aws-lambda';
import {AlarmInterface, DeviceInterface} from '../interfaces';
import {AssetService} from '../services/asset.service';
import {AssetType, DeviceStatus} from '../enums';
import {getOfflineAlarm} from '../utils';
import {AlarmService} from '../services/alarm.service';
import {ConnectService} from '../services/connect.service';


const alarmService = AlarmService.getInstance();
const assetService = AssetService.getInstance();
const connectService = ConnectService.getInstance();

const notifyAlarm = async (alarm: AlarmInterface, device: DeviceInterface, userIndex: number): Promise<void> => {
	const phone: string = alarm.users[userIndex];
	await connectService.initiateOutgoingCall(phone, {
		alarmId: alarm.alarmId,
		device: device.assetName,
		deviceId: device.assetId,
		message: alarm.message,
		phone,
		userIndex: userIndex + ''
	});
	console.log(`[${device.assetId}] : User ${phone} notified`);
};

export const handler = async (event: ScheduledEvent): Promise<any> => {
	try {
		const offlineDevices: DeviceInterface[] = [];
		let devices: DeviceInterface[] = await assetService.fetchAssetsByAssetType(AssetType.DEVICE);
		devices = devices.filter((device: DeviceInterface) => device.assetStatus === DeviceStatus.ACTIVE);
		const timestamp: number = Date.now();
		for (const device of devices) {
			const diffTS: number = timestamp - device.lastTransmitted;
			if (device.inBatch) {
				if (diffTS > 11 * 60000 && diffTS < 12 * 60000) {
					offlineDevices.push(device);
				}
			} else {
				if (diffTS > 121 * 60000 && diffTS < 122 * 60000) {
					offlineDevices.push(device);
				}
			}
		}

		if (offlineDevices.length === 0) {
			return;
		}

		for (const device of offlineDevices) {
			const alarm: AlarmInterface = getOfflineAlarm(device, timestamp);
			alarm.attempt = 1;
			await alarmService.createAlarm(alarm);
			await notifyAlarm(alarm, device, 0);
		}
	} catch (err) {
		console.error(err);
	}
};
