import {AssetService} from './asset.service';
import {BuildingCreateRequest, BuildingInterface, CompanyUpdateRequest, FarmInterface, DeviceInterface, UserInterface} from '../interfaces';
import {generateUUID, AccessDeniedException, ResourceNotFoundException} from '../utils';
import {AssetType, CompanyRoles, UserRole} from '../enums';

export class CompanyService {

	private static instance: CompanyService;

	private readonly assetService: AssetService;

	private constructor() {
		this.assetService = AssetService.getInstance();
	}

	async createCompany(request: BuildingCreateRequest): Promise<BuildingInterface> {
		const companyId: string = generateUUID();
		const company: BuildingInterface = request.mapBuilding(companyId);
		await this.assetService.createAsset(company);
		return company;
	}

	async fetchCompanies(principal: UserInterface): Promise<BuildingInterface[]> {
		let companies: BuildingInterface[] = [];
		if (UserRole.ADMIN === principal.role) {
			companies = await this.assetService.fetchAssetsByAssetType(AssetType.COMPANY);
		} else if (CompanyRoles.includes(principal.role)) {
			companies = [
				await this.assetService.fetchAssetByAssetId(principal.companyId, AssetType.COMPANY)
			];
		}
		return companies
	}

	async fetchCompanyById(principal: UserInterface, companyId: string): Promise<BuildingInterface> {
		if (CompanyRoles.includes(principal.role) && principal.companyId !== companyId) {
			throw new ResourceNotFoundException(`Company ${companyId} not found`);
		}
		return await this.assetService.fetchAssetByAssetId(companyId, AssetType.COMPANY);
	}

	async updateCompany(principal: UserInterface, companyId: string, request: CompanyUpdateRequest): Promise<BuildingInterface> {
		const prevCompany: BuildingInterface = await this.fetchCompanyById(principal, companyId);
		const newCompany = request.mapCompany(prevCompany);
		await this.assetService.updateAsset(newCompany);
		return newCompany;
	}

	async deleteCompany(principal: UserInterface, companyId: string): Promise<BuildingInterface> {
		const company: BuildingInterface = await this.fetchCompanyById(principal, companyId);
		// TODO: Ensure all resources under the company are deleted.
		const farms: FarmInterface[] = await this.assetService.fetchAssetsByCompany(AssetType.FARM, companyId);
		if (farms.length > 0) {
			throw new AccessDeniedException(`Access denied. Company containing farms cannot be deleted.`);
		}
		const users: UserInterface[] = await this.assetService.fetchAssetsByCompany(AssetType.USER, companyId);
		if (users.length > 0) {
			throw new AccessDeniedException(`Access denied. Company containing users cannot be deleted.`);
		}
		const devices: DeviceInterface[] = await this.assetService.fetchAssetsByCompany(AssetType.DEVICE, companyId);
		if (devices.length > 0) {
			throw new AccessDeniedException(`Access denied. Company containing devices cannot be deleted.`);
		}
		await this.assetService.deleteAssetByAssetId(companyId, AssetType.COMPANY);
		return company;
	}

	static getInstance(): CompanyService {
		if (!CompanyService.instance) {
			CompanyService.instance = new CompanyService();
		}
		return CompanyService.instance;
	}
}
