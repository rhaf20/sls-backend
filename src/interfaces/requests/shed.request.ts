import {NotBlank, Pattern} from '../../decorators';
import {RegexConstant} from '../../constants';
import {FarmInterface, ShedInterface} from '../asset.interface';
import {deepClone} from '../../utils';
import {ValidatorUtil as vu} from '../../utils/validator.util';
import {AssetType} from '../../enums';


export class ShedCreateRequest {

	@NotBlank()
	assetName: string;

	@Pattern(RegexConstant.UUID_PATTERN, false)
	farmId: string;

	constructor(payload: string) {
		const request: ShedCreateRequest = JSON.parse(payload);
		this.assetName = request.assetName;
		this.farmId = request.farmId;
	}

	mapShed(shedId: string, farm: FarmInterface): ShedInterface {
		const timestamp: number = Date.now();
		return {
			assetId: shedId,
			assetName: this.assetName,
			assetType: AssetType.SHED,
			companyId: farm.companyId,
			createdAt: timestamp,
			farmId: farm.assetId,
			updatedAt: timestamp
		}
	}
}

export class ShedUpdateRequest {

	assetName: string;

	constructor(payload: string) {
		const request: ShedUpdateRequest = JSON.parse(payload);
		this.assetName = request.assetName;
	}

	mapShed(prevShed: ShedInterface): ShedInterface {
		const shed: ShedInterface = deepClone(prevShed);
		if (vu.notBlank(this.assetName)) {
			shed.assetName = this.assetName;
		}
		shed.updatedAt = Date.now();
		return shed;
	}
}
