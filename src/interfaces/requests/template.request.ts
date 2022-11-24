import {NotBlank, Pattern} from '../../decorators';
import {RegexConstant} from '../../constants';
import {LimitInterface, TemplateInterface} from '../template.interface';
import {AssetType} from '../../enums';
import {deepClone} from '../../utils';
import {ValidatorUtil as vu} from '../../utils/validator.util';


export class TemplateCreateRequest {

	@NotBlank()
	assetName: string;

	@Pattern(RegexConstant.UUID_PATTERN, true)
	companyId: string;      // Only for Admin user

	duration: number;
	limits: LimitInterface[];
	locked: boolean;

	constructor(payload: string) {
		const request: TemplateCreateRequest = JSON.parse(payload);
		this.assetName = request.assetName;
		this.companyId = request.companyId;
		this.duration = request.duration;
		this.limits = request.limits;
		this.locked = request.locked;
	}

	mapTemplate(templateId: string): TemplateInterface {
		const timestamp: number = Date.now();
		return {
			assetId: templateId,
			assetName: this.assetName,
			assetType: AssetType.TEMPLATE,
			companyId: this.companyId,
			createdAt: timestamp,
			updatedAt: timestamp,

			duration: this.duration,
			limits: this.limits,
			locked: this.locked
		};
	}
}

export class TemplateUpdateRequest {

	@NotBlank()
	assetName: string;

	duration: number;
	limits: LimitInterface[];
	locked: boolean;

	constructor(payload: string) {
		const request: TemplateCreateRequest = JSON.parse(payload);
		this.assetName = request.assetName;
		this.duration = request.duration;
		this.limits = request.limits;
		this.locked = request.locked;
	}

	mapTemplate(prevTemplate: TemplateInterface): TemplateInterface {
		const template: TemplateInterface = deepClone(prevTemplate);
		if (vu.notBlank(this.assetName)) {
			template.assetName = this.assetName;
		}
		if (vu.notNull(this.duration)) {
			template.duration = this.duration;
		}
		if (vu.notNull(this.limits)) {
			template.limits = this.limits;
		}
		if (vu.notNull(this.locked)) {
			template.locked = this.locked;
		}
		template.updatedAt = Date.now();
		return template;
	}
}
