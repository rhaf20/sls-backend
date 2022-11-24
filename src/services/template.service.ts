import {AssetService} from './asset.service';
import {TemplateInterface, UserInterface} from '../interfaces';
import {AssetType, CompanyRoles, UserRole} from '../enums';
import {TemplateCreateRequest, TemplateUpdateRequest} from '../interfaces/requests/template.request';
import {AccessDeniedException, BadRequestException, generateUUID} from '../utils';

export class TemplateService {

	private static instance: TemplateService;

	private readonly assetService: AssetService;

	private constructor() {
		this.assetService = AssetService.getInstance();
	}

	async createTemplate(principal: UserInterface, request: TemplateCreateRequest): Promise<TemplateInterface> {
		const templateId: string = generateUUID();
		const template: TemplateInterface = request.mapTemplate(templateId);

		if (UserRole.OWNER === principal.role) {
			template.companyId = principal.companyId;
		}

		if (template.companyId) {
			/* Verify that the company exists. */
			await this.assetService.fetchAssetByAssetId(template.companyId, AssetType.COMPANY);
		}

		await this.assetService.createAsset(template);
		return template;
	}

	async fetchTemplates(principal: UserInterface, companyId: string): Promise<TemplateInterface[]> {
		let templates: TemplateInterface[] = [];
		const allTemplates: TemplateInterface[] = await this.assetService.fetchAssetsByAssetType(AssetType.TEMPLATE);
		/*
		* If principal is A and companyId is undefined, then fetch all templates.
		* If principal is A and companyId is defined, then fetch templates by company.
		* If principal is company-users, then fetch all templates within company.
		* */
		if (UserRole.ADMIN === principal.role) {
			if (companyId) {
				templates = allTemplates.filter(
					(template: TemplateInterface) => template.companyId === companyId || !template.companyId);
			} else {
				templates = allTemplates;
			}
		} else if (CompanyRoles.includes(principal.role)) {
			templates = allTemplates.filter(
				(template: TemplateInterface) => template.companyId === principal.companyId || !template.companyId);
		}
		return templates;
	}

	async fetchTemplateByTemplateId(principal: UserInterface, templateId: string): Promise<TemplateInterface> {
		const template: TemplateInterface = await this.assetService.fetchAssetByAssetId(templateId, AssetType.TEMPLATE);
		/**
		 * If principal is A, then fetch template.
		 * If principal is CompanyRole, then validate that template is from the same company.
		 */
		if (CompanyRoles.includes(principal.role)) {
			if (template.companyId !== principal.companyId) {
				throw new AccessDeniedException(`Access denied. Cannot fetch template ${templateId}`);
			}
		}
		return template;
	}

	async updateTemplate(principal: UserInterface, templateId: string,
	                     request: TemplateUpdateRequest): Promise<TemplateInterface> {
		const prevTemplate: TemplateInterface = await this.fetchTemplateByTemplateId(principal, templateId);
		const newTemplate: TemplateInterface = request.mapTemplate(prevTemplate);
		await this.assetService.updateAsset(newTemplate);
		return newTemplate;
	}

	async deleteTemplate(principal: UserInterface, templateId: string): Promise<TemplateInterface> {
		const template: TemplateInterface = await this.fetchTemplateByTemplateId(principal, templateId);
		await this.assetService.deleteAssetByAssetId(templateId, AssetType.TEMPLATE);
		return template;
	}

	static getInstance(): TemplateService {
		if (!TemplateService.instance) {
			TemplateService.instance = new TemplateService();
		}
		return TemplateService.instance;
	}
}
