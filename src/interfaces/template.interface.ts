import {AssetType} from '../enums';

export interface LimitInterface {
	iT: number;
	pT: number;
	nT: number;
	tR: number;
}

export interface TemplateInterface {
	assetId: string;
	assetName: string;
	assetType: AssetType.TEMPLATE;
	companyId?: string;
	createdAt: number;
	updatedAt: number;

	duration: number;
	limits: LimitInterface[];
	locked: boolean;
}
