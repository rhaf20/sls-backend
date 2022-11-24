import {AssetService} from './asset.service';
import {ShedCreateRequest, ShedUpdateRequest} from '../interfaces';
import {DeviceInterface, FarmInterface, ShedInterface, UserInterface} from '../interfaces';
import {AccessDeniedException, generateUUID, validateFarmAccess} from '../utils';
import {AssetType, CompanyRoles, UserRole} from '../enums';

export class ShedService {

	private static instance: ShedService;

	private readonly assetService: AssetService;

	private constructor() {
		this.assetService = AssetService.getInstance();
	}

	async createShed(request: ShedCreateRequest, principal: UserInterface): Promise<ShedInterface> {

		/* Validate that farm exists. */
		const farm: FarmInterface = await this.assetService.fetchAssetByAssetId(request.farmId, AssetType.FARM);

		/*
		* If principal is O, then farm must belong to same company.
		* If principal is M, then principal must be assigned to farm.
		* */
		const isInvalidOwner: boolean = UserRole.OWNER === principal.role && farm.companyId !== principal.companyId;
		const isInvalidManager: boolean = UserRole.MANAGER === principal.role && !validateFarmAccess(farm,
			principal.assetId);
		if (isInvalidOwner || isInvalidManager) {
			throw new AccessDeniedException(`Access denied. Farm ${farm.assetId} is not accessible`);
		}

		/* Create farm. */
		const shedId: string = generateUUID();
		const shed: ShedInterface = request.mapShed(shedId, farm);
		await this.assetService.createAsset(shed);
		return shed;
	}

	async fetchSheds(principal: UserInterface, companyId: string, farmId: string): Promise<ShedInterface[]> {
		let sheds: ShedInterface[] = [];
		/*
		* If principal is A and farmId is defined, then fetch all sheds by farm.
		* If principal is A and companyId is defined, then fetch all sheds by company.
		* If principal is A and no filter, then fetch all sheds.
		* */
		if (UserRole.ADMIN === principal.role) {
			if (farmId) {
				sheds = await this.assetService.fetchAssetsByFarm(AssetType.SHED, farmId);
			} else if (companyId) {
				sheds = await this.assetService.fetchAssetsByCompany(AssetType.SHED, companyId);
			} else {
				sheds = await this.assetService.fetchAssetsByAssetType(AssetType.SHED);
			}
		}

		/* For company roles,
		*
		* If farmId is defined,
		*   If farm does not exist, then 400.
		*   Else if principal is O and farm does not belong to principal's company, then 403.
		*   Else if principal is M and principal is not assigned to farm, then 403.
		*   Else, fetch sheds by farm.
		* Else if principal is O, then fetch sheds by company.
		* Else if principal is M, then fetch sheds from assigned farms.
		* */
		else if (CompanyRoles.includes(principal.role)) {
			if (farmId) {
				const farm: FarmInterface = await this.assetService.fetchAssetByAssetId(farmId, AssetType.FARM);

				const isInvalidOwner: boolean = UserRole.OWNER === principal.role && farm.companyId !== principal.companyId;
				const isInvalidManager: boolean = [UserRole.MANAGER].includes(principal.role) && !validateFarmAccess(
					farm, principal.assetId);
				if (isInvalidOwner || isInvalidManager) {
					throw new AccessDeniedException(`Access denied. Cannot access farm ${farmId}`);
				}
				sheds = await this.assetService.fetchAssetsByFarm(AssetType.SHED, farmId);
			} else {
				sheds = await this.assetService.fetchAssetsByCompany(AssetType.SHED, principal.companyId);
				if ([UserRole.MANAGER].includes(principal.role)) {
					const farms: FarmInterface[] = await this.assetService.fetchAssetsByCompany(AssetType.FARM,
						principal.companyId);
					const assignedFarmIds: string[] = farms
						.filter((_farm: FarmInterface) => _farm.users && _farm.users.includes(principal.assetId))
						.map((_farm: FarmInterface) => _farm.assetId);
					sheds = sheds.filter((_shed: ShedInterface) => assignedFarmIds.includes(_shed.farmId));
				}
			}
		}
		return sheds;
	}

	async fetchShedByShedId(principal: UserInterface, shedId: string): Promise<ShedInterface> {
		const shed: ShedInterface = await this.assetService.fetchAssetByAssetId(shedId, AssetType.SHED);
		/*
		* If principal is A, then fetch shed.
		* If principal is O, then verify shed belongs to same company.
		* If principal is M, then validate that they have access to sheds's farm.
		* */
		if (CompanyRoles.includes(principal.role)) {
			if (shed.companyId !== principal.companyId) {
				throw new AccessDeniedException(`Access denied. Cannot fetch shed ${shedId}`);
			}
			if ([UserRole.MANAGER].includes(principal.role)) {
				const farm: FarmInterface = await this.assetService.fetchAssetByAssetId(shed.farmId, AssetType.FARM);
				validateFarmAccess(farm, principal.assetId);
			}
		}
		return shed;
	}

	async updateShed(principal: UserInterface, shedId: string, request: ShedUpdateRequest): Promise<ShedInterface> {
		const prevShed: ShedInterface = await this.fetchShedByShedId(principal, shedId);
		const newShed: ShedInterface = request.mapShed(prevShed);
		await this.assetService.updateAsset(newShed);
		return newShed;
	}

	async deleteShed(principal: UserInterface, shedId: string): Promise<ShedInterface> {
		const shed: ShedInterface = await this.fetchShedByShedId(principal, shedId);
		// TODO: Ensure all resources mapped to this shed are deleted.
		const devices: DeviceInterface[] = await this.assetService.fetchAssetsByShed(AssetType.DEVICE, shedId);
		if (devices.length > 0) {
			throw new AccessDeniedException('Access denied. Shed containing devices cannot be deleted.');
		}
		await this.assetService.deleteAssetByAssetId(shedId, AssetType.SHED);
		return shed;
	}

	static getInstance(): ShedService {
		if (!ShedService.instance) {
			ShedService.instance = new ShedService();
		}
		return ShedService.instance;
	}
}
