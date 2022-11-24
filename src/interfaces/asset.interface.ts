import {ShadowInterface} from './shadow.interface';
import {AssetType, DeviceStatus} from '../enums';

export interface BuildingInterface {
	id: string;
	name: string;
	assetStatus?: string;
	assetType: AssetType.COMPANY;
	createdAt: number;
	updatedAt: number;

	email: string;
	enabled: boolean;
}

export interface FarmInterface {
	assetId: string;
	assetName: string;
	assetStatus?: string;
	assetType: AssetType.FARM;
	companyId: string;
	createdAt: number;
	updatedAt: number;

	users: string[];            // List of user id
}

export interface ShedInterface {
	assetId: string;
	assetName: string;
	assetStatus?: string;
	assetType: AssetType.SHED;
	companyId: string;
	createdAt: number;
	farmId: string;
	updatedAt: number;
}

export interface DeviceInterface extends ShadowInterface {
	assetId: string;
	assetName: string;
	assetStatus: DeviceStatus;
	assetType: AssetType.DEVICE;
	companyId: string;
	createdAt: number;
	enableCall: boolean;
	errorMessage?: string;
	farmId: string;
	inBatch: boolean;
	isOnline: boolean;
	lastTransmitted: number;
	shedId: string;
	templateId: string;
	updatedAt: number;
}
