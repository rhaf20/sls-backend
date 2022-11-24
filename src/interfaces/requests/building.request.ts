import {BuildingInterface} from '../asset.interface';
import {deepClone} from '../../utils';
import {ValidatorUtil as vu} from '../../utils/validator.util';
import {NotBlank, NotNull} from '../../decorators';
import {AssetType} from '../../enums';


export class BuildingCreateRequest {

	@NotBlank()
	assetName: string;

	@NotBlank()
	email: string;

	@NotNull()
	enabled: boolean;

	constructor(payload: string) {
		const request: BuildingCreateRequest = JSON.parse(payload);
		this.assetName = request.assetName;
		this.email = request.email;
		this.enabled = request.enabled;
	}

	mapBuilding(companyId: string): BuildingInterface {
		const timestamp: number = Date.now();
		return {
			assetId: companyId,
			assetName: this.assetName,
			assetType: AssetType.COMPANY,
			createdAt: timestamp,
			email: this.email,
			enabled: this.enabled,
			updatedAt: timestamp
		};
	}
}

export class CompanyUpdateRequest {
	assetName: string;
	email: string;
	enabled: boolean;

	constructor(payload: string) {
		const request: CompanyUpdateRequest = JSON.parse(payload);
		this.assetName = request.assetName;
		this.email = request.email;
		this.enabled = request.enabled;
	}

	mapCompany(prevCompany: BuildingInterface): BuildingInterface {
		const company: BuildingInterface = deepClone(prevCompany);
		if (this.assetName) {
			company.assetName = this.assetName;
		}
		if (this.email) {
			company.email = this.email;
		}
		if (vu.notNull(this.enabled)) {
			company.enabled = this.enabled;
		}
		company.updatedAt = Date.now();
		return company;
	}
}
