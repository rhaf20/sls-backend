import {AlarmType} from '../enums';

export interface AlarmInterface {
	alarmCode: number;
	alarmId: string;
	alarmType: AlarmType;
	attempt: number;
	message: string;
	timestamp: number;
	createdAt: number;
	updatedAt: number;

	/* Hierarchy */
	deviceId: string;
	shedId: string;
	farmId: string;
	companyId: string;

	/* Notify */
	notify: boolean;
	notifiedAt: number;
	users: string[];
}
