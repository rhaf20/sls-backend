import {NotBlank, Pattern} from '../../decorators';
import {RegexConstant} from '../../constants';
import {FarmInterface} from '../asset.interface';
import {deepClone} from '../../utils';
import {ValidatorUtil as vu} from '../../utils/validator.util';
import {AssetType} from '../../enums';


export class FarmCreateRequest {

	@NotBlank()
	assetName: string;

	@Pattern(RegexConstant.UUID_PATTERN, true)
	companyId: string;      // Only for Admin user

	@Pattern(RegexConstant.UUID_PATTERN, true)
	users: string[];

	constructor(payload: string) {
		const request: FarmCreateRequest = JSON.parse(payload);
		this.assetName = request.assetName;
		this.companyId = request.companyId;
		this.users = request.users;
	}

	mapFarm(farmId: string): FarmInterface {
		const timestamp: number = Date.now();
		return {
			assetId: farmId,
			assetName: this.assetName,
			assetType: AssetType.FARM,
			companyId: this.companyId,
			createdAt: timestamp,
			updatedAt: timestamp,
			users: this.users || []
		};
	}
}

export class FarmUpdateRequest {

	assetName: string;

	@Pattern(RegexConstant.UUID_PATTERN, true)
	users: string[];

	constructor(payload: string) {
		const request: FarmUpdateRequest = JSON.parse(payload);
		this.assetName = request.assetName;
		this.users = request.users;
	}

	mapFarm(prevFarm: FarmInterface): FarmInterface {
		const farm: FarmInterface = deepClone(prevFarm);
		if (vu.notBlank(this.assetName)) {
			farm.assetName = this.assetName;
		}
		if (vu.notEmpty(this.users)) {
			farm.users = this.users;
		}
		farm.updatedAt = Date.now();
		return farm;
	}
}
