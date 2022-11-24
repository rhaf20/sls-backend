import {UserRole} from '../enums';
import {DeviceInterface} from './asset.interface';
import {AlarmInterface} from './alarm.interface';

export interface ConnectionInterface {
	cType: 'WS',
	companyId?: string;
	connectionId: string;
	devices?: string[];
	role: UserRole;
	userId: string;
}

export enum WSMessageType {
	ALARM = 'ALARM',
	DEVICE = 'DEVICE',
}

export interface WSMessage {
	action: 'message';
	data: AlarmInterface | DeviceInterface;
	type: WSMessageType;
}
