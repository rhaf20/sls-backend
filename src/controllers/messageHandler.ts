import {ValidatorUtil as vu} from '../utils/validator.util';
import {RegexConstant, TZConstant} from '../constants';
import {IotService} from '../services/iot.service';
import {getLastElement, getTempAlarm, getTimezoneOffset, hasKey, toMS, toUTC} from '../utils';
import {
	AlarmInterface,
	DataPoint,
	DeviceInterface,
	FarmInterface,
	MessageInterface,
	ShadowUpdateEvent,
	WSMessage,
	WSMessageType
} from '../interfaces';
import {DesiredInterface, ReportedMessage, ShadowInterface} from '../interfaces/shadow.interface';
import {AssetService} from '../services/asset.service';
import {AssetType} from '../enums';
import {ApiService} from '../services/api.service';
import {TimeseriesService} from '../services/timeseries.service';
import {AlarmService} from '../services/alarm.service';
import {ConnectService} from '../services/connect.service';


interface ProcessResult {
	alarm?: AlarmInterface;
	device?: DeviceInterface;
}

const alarmService = AlarmService.getInstance();
const apiService = ApiService.getInstance();
const assetService = AssetService.getInstance();
const connectService = ConnectService.getInstance();
const iot = IotService.getInstance();
const tsService = TimeseriesService.getInstance();

const tzOffset: number = getTimezoneOffset(TZConstant.NZ) * 60000;  // -780 * 60000

const updateRepublisher = async (message: MessageInterface): Promise<any> => {
	try {
		// Fetch device id
		const deviceId: string = getDeviceIdFromTopic(message.topic);

		await tsService.logMessage(deviceId, message);

		// TODO: Remove when older version retires. (Prevents update for devices running on older version)
		await assetService.fetchAssetByAssetId(deviceId, AssetType.DEVICE);

		if (!hasKey(message.state, 'reported')) {
			message.state.reported = {} as ReportedMessage;
		}
		message.state.reported.deviceId = deviceId;
		await iot.updateDeviceShadow(deviceId, message);

		/* Republish on <deviceId>/shadow/update/accepted topic. */
		const shadow: any = JSON.parse(await iot.fetchDeviceShadow(deviceId));
		const acceptedPayload: any = {};
		if (hasKey(shadow, 'state.desired.FW')) {
			acceptedPayload['FW'] = shadow.state.desired.FW;
		}
		if (hasKey(shadow, 'version')) {
			acceptedPayload['version'] = shadow.version;
		}
		const repTopic = `${deviceId}/shadow/update/accepted`;
		await iot.publish(repTopic, acceptedPayload);

		console.log(`Message republished successfully - ${repTopic}`);
	} catch (err) {
		console.error(`Error in republishing : Topic ${message.topic}`);
		console.error(err.stack);
		console.log(JSON.stringify(message));
	}
};

const getDeviceId = (event: ShadowUpdateEvent): string => {
	const deviceId: string = event.current.state.reported.deviceId;
	console.log('Message received for device : ' + deviceId);
	return deviceId;
};

const setDeviceProperties = (device: DeviceInterface, event: ShadowUpdateEvent): DeviceInterface => {

	/* Copy properties from message to the device. */
	const reported: ShadowInterface = event.current.state.reported;
	if (hasKey(reported, 'alarm')) {
		device.alarm = reported.alarm;
	}
	if (hasKey(reported, 'alarmTS')) {
		device.alarmTS = toUTC(toMS(reported.alarmTS), tzOffset);
	}
	if (hasKey(reported, 'cOut')) {
		device.cOut = toUTC(toMS(reported.cOut), tzOffset);
	}
	if (hasKey(reported, 'day')) {
		device.day = reported.day;
	}
	if (hasKey(reported, 'devTS')) {
		device.devTS = toUTC(toMS(reported.devTS), tzOffset);
	}
	if (hasKey(reported, 'dur')) {
		device.dur = reported.dur;
	}
	if (hasKey(reported, 'freq')) {
		device.freq = reported.freq;
	}
	if (hasKey(reported, 'FW')) {
		device.FW = reported.FW;
	}
	if (hasKey(reported, 'inh')) {
		device.inh = reported.inh;
	}
	if (hasKey(reported, '')) {
	}
	device.inhTS = reported.inhTS;
	if (hasKey(reported, 'iT')) {
		device.iT = reported.iT;
	}
	if (hasKey(reported, 'nT')) {
		device.nT = reported.nT;
	}
	if (hasKey(reported, 'pT')) {
		device.pT = reported.pT;
	}
	if (hasKey(reported, 'rT')) {
		device.rT = reported.rT;
	}
	if (hasKey(reported, 'sEn')) {
		device.sEn = reported.sEn;
	}
	if (hasKey(reported, 'SMSEn')) {
		device.SMSEn = reported.SMSEn;
	}
	if (hasKey(reported, 'sSq')) {
		device.sSq = reported.sSq;
	}
	if (hasKey(reported, 'start')) {
		device.start = toUTC(toMS(reported.start), tzOffset);
	}
	if (hasKey(reported, 'tempTS')) {
		device.tempTS = toUTC(toMS(reported.tempTS), tzOffset);
	}
	if (hasKey(reported, 'tR')) {
		device.tR = reported.tR;
	}
	device.lastTransmitted = event.timestamp;
	device.isOnline = true;
	device.inBatch = isInBatch(device.devTS, device.start, device.cOut);

	const desired: DesiredInterface = event.current.state.desired;
	if (hasKey(desired, 'SMSNum')) {
		device.SMSNum = desired.SMSNum;
	}
	return device;
};

const updateDeviceInDB = async (device: DeviceInterface): Promise<void> => {
	/* Health check, pre-processing should be done here. */
	await assetService.updateAsset(device);
};

const isInBatch = (devTS: number, start: number, cOut: number): boolean => {
	return devTS > start && devTS < cOut;
	/*const reported: ShadowInterface = event.current.state.reported;
	const devTS: number = toUTC(toMS(event.current.state.reported.devTS), tzOffset);
	return reported.day < reported.dur && devTS > reported.start && devTS < reported.cOut;*/
};

const saveDataPoints = async (device: DeviceInterface, event: ShadowUpdateEvent): Promise<void> => {
	const pointGap: number = 60000;     // 1 minute
	const reported: ShadowInterface = event.current.state.reported;
	const index = reported.day;
	let startTime: number = device.tempTS - (pointGap * reported.rT.length);
	const points: DataPoint[] = reported.rT.map((temp: number) => {
		startTime += pointGap;
		return {
			alarm: reported.alarm,
			assetId: device.assetId,
			day: reported.day,
			inBatch: device.inBatch,
			iT: reported.iT[index],
			nT: reported.nT[index],
			pT: reported.pT[index],
			rT: temp,
			timestamp: startTime,
			tR: reported.tR ? reported.tR[index] : null,
		};
	});
	await tsService.insertPoints(points);
};

const sendMessage = async (device: DeviceInterface, farm: FarmInterface,
                           processResult: ProcessResult): Promise<any> => {
	const messages: WSMessage[] = [];
	if (processResult.device) {
		messages.push({
			action: 'message',
			data: processResult.device,
			type: WSMessageType.DEVICE
		})
	}
	if (processResult.alarm) {
		messages.push({
			action: 'message',
			data: processResult.alarm,
			type: WSMessageType.ALARM
		});
	}
	await apiService.sendMessage(device, farm, messages);
};

const processAlarm = async (device: DeviceInterface, event: ShadowUpdateEvent): Promise<AlarmInterface> => {

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

	const current: ShadowInterface = event.current.state.reported;
	const alarmCode: number = current.alarm;
	
	// If alarm is OK or Power glitch, don't create an alarm
	let tempAlarmCode = alarmCode;
	tempAlarmCode &= ~(1<<4);
	if (!tempAlarmCode) {
		return null;
	}

	const lastAlarm: AlarmInterface = await alarmService.fetchLastDeviceAlarm(device.assetId);

	const isSameAlarm: boolean = !!lastAlarm && alarmCode === lastAlarm.alarmCode;

	let alarm: AlarmInterface;
	// const alarmTS: number = toUTC(toMS(current.alarmTS), tzOffset);
	const timestamp: number = Date.now();
	if (isSameAlarm) {
		/**
		 * If the command is beyond 15 minutes, then notify next phone number in the list.
		 * Else, no action required.
		 */
		if ((timestamp - lastAlarm.updatedAt) > (15 * 60000)) {
			alarm = lastAlarm;
			alarm.updatedAt = Date.now();
		}
	} else {
		const subscribers: string[] = event.current.state.desired.SMSNum;
		const tempValue: number = getLastElement(current.rT);
		alarm = getTempAlarm(alarmCode, timestamp, device, tempValue, subscribers);
		await alarmService.createAlarm(alarm);
	}

	if (!alarm) {
		return null;
	}

	if (device.enableCall && vu.notEmpty(alarm.users)) {
		const userIndex: number = alarm.attempt % alarm.users.length;
		await notifyAlarm(alarm, device, userIndex);
		alarm.attempt++;
		alarm.notifiedAt = Date.now();
	}
	await alarmService.updateAlarm(alarm);
	return alarm;
};

/*const processAlarm = async (device: DeviceInterface, event: ShadowUpdateEvent): Promise<AlarmInterface> => {

	const checkAlarm = (event: ShadowUpdateEvent): boolean => {
		const previousAlarmTS: number = event.previous.metadata.reported.alarm.timestamp;
		const currentAlarmTS: number = event.current.metadata.reported.alarm.timestamp;
		return currentAlarmTS !== previousAlarmTS;
	};

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

	/!* Check for alarm condition *!/
	if (!checkAlarm(event)) {
		return null;
	}

	/!* Shadow values *!/
	const alarmCode: number = event.current.state.reported.alarm;
	const alarmTS: number = event.current.state.reported.alarmTS;
	const tempValue: number = getLastElement(event.current.state.reported.rT);
	const subscribers: string[] = event.current.state.desired.SMSNum;

	/!* Generate alarm *!/
	const alarm: AlarmInterface = getTempAlarm(alarmCode, alarmTS, device, tempValue, subscribers);

	/!* Notify alarm *!/
	if (device.enableCall && vu.notEmpty(alarm.users)) {
		await notifyAlarm(alarm, device, 0);
		alarm.attempt += 1;
		alarm.notifiedAt = Date.now();
	}

	/!* Store alarm *!/
	await alarmService.createAlarm(alarm);
	return alarm;
};*/

const processMessage = async (event: ShadowUpdateEvent): Promise<any> => {
	try {
		console.log(JSON.stringify(event));
		const deviceId: string = getDeviceId(event);

		// TODO: Remove when older version retires. (Prevents update for devices running on older version)
		await assetService.fetchAssetByAssetId(deviceId, AssetType.DEVICE);

		event.timestamp = toMS(event.timestamp);

		/* Processing */
		let processResult: ProcessResult = {};
		let device: DeviceInterface = await assetService.fetchAssetByAssetId(deviceId, AssetType.DEVICE);
		device = setDeviceProperties(device, event);

		/* Storing in database */
		await updateDeviceInDB(device);
		await saveDataPoints(device, event);

		/* Process alarm */
		const alarm: AlarmInterface = await processAlarm(device, event);
		if (alarm) {
			processResult.alarm = alarm;
		}

		/* Broadcast updated device */
		const farm: FarmInterface = await assetService.fetchAssetByAssetId(device.farmId, AssetType.FARM);
		processResult.device = device;
		await sendMessage(device, farm, processResult);
	} catch (err) {
		console.error(`Error in processing : Device ${event.current.state.reported.deviceId}`);
		console.error(err.stack);
		console.log(JSON.stringify(event));
	}
};

export const handler = async (event: any): Promise<any> => {
	try {
		if (event.topic && vu.validateStringPattern(event.topic, RegexConstant.TOPIC_PATTERN)) {
			await updateRepublisher(event);
		} else {
			await processMessage(event);
		}
	} catch (err) {
		console.error(err);
	}
};

/**
 * Extract deviceId from topic : {deviceId}/sh/update
 *
 * @param topic
 */
const getDeviceIdFromTopic = (topic: string): string => {
	if (vu.validateStringPattern(topic, RegexConstant.TOPIC_PATTERN)) {
		return topic.split('/')[0];
	}
	throw new Error(`Invalid topic: ${topic}`);
};
