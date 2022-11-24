import {AlarmType} from '../enums';
import {AlarmInterface, DeviceInterface} from '../interfaces';
import {generateUUID} from './index';

const getAlarmMessage = (alarm: number, deviceName: string, tempValue: number): string => {
	let messages: string[] = [];
	if (alarm >= 64) {
		messages.push(`Sensor failure in ${deviceName}.`);
		alarm -= 64;
	}
	if (alarm >= 32) {
		messages.push(`Power to ${deviceName} is off.`);
		alarm -= 32;
	}
	if (alarm >= 16) {
		messages.push(`Power glitch in ${deviceName}.`);
		alarm -= 16;
	}
	if (alarm >= 8) {
		messages.push(`${deviceName} is heating fast.`);
		alarm -= 8;
	}
	if (alarm >= 4) {
		messages.push(`${deviceName} is cooling fast.`);
		alarm -= 4;
	}
	if (alarm >= 2) {
		messages.push(`Temperature in ${deviceName} is now ${tempValue} and hot`);
		alarm -= 2;
	}
	if (alarm >= 1) {
		messages.push(`Temperature in ${deviceName} is now ${tempValue} and cold`);
		// alarm -= 1;
	}
	return messages.join(' ');
};

const getAlarmType = (alarm: number): AlarmType => {
	if (alarm < 16) {
		return AlarmType.TEMP;
	} else if (alarm === 16) {
		return AlarmType.POWER;
	} else {
		return AlarmType.TEMP_POWER;
	}
};

export const getTempAlarm = (alarmCode: number, alarmTS: number, device: DeviceInterface,
                             tempValue: number, users: string[]): AlarmInterface => {
	return {
		alarmCode: alarmCode,
		alarmId: generateUUID(),
		alarmType: getAlarmType(alarmCode),
		attempt: 0,
		companyId: device.companyId,
		createdAt: alarmTS,
		deviceId: device.assetId,
		farmId: device.farmId,
		message: getAlarmMessage(alarmCode, device.assetName, tempValue),
		notifiedAt: 0,
		notify: true,
		shedId: device.shedId,
		timestamp: alarmTS,
		updatedAt: alarmTS,
		users: users
	};
};

export const getOfflineAlarm = (device: DeviceInterface, timestamp: number): AlarmInterface => {
	return {
		alarmCode: 1000,
		alarmId: generateUUID(),
		alarmType: AlarmType.OFFLINE,
		attempt: 0,
		companyId: device.companyId,
		createdAt: timestamp,
		deviceId: device.assetId,
		farmId: device.farmId,
		message: `Device ${device.assetName} went offline`,
		notifiedAt: timestamp,
		notify: true,
		shedId: device.shedId,
		timestamp: timestamp,
		updatedAt: timestamp,
		users: device.SMSNum
	}
};
