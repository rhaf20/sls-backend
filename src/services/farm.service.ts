import {AssetService} from './asset.service';
import {FarmInterface, ShedInterface, UserInterface} from '../interfaces';
import {
	AccessDeniedException,
	BadRequestException,
	generateUUID,
	removeDuplicates,
	validateFarmAccess,
	validateUsersByCompany
} from '../utils';
import {FarmCreateRequest, FarmUpdateRequest} from '../interfaces';
import {ApiConstant} from '../constants';
import {ValidatorUtil as vu} from '../utils/validator.util';
import {AssetType, CompanyRoles, UserRole} from '../enums';


export class FarmService {

	private static instance: FarmService;

	private readonly assetService: AssetService;

	private constructor() {
		this.assetService = AssetService.getInstance();
	}

	async createFarm(request: FarmCreateRequest, principal: UserInterface): Promise<FarmInterface> {
		/*
		* If principal is A, then can create farm.
		* If principal is A and 'companyId' is undefined, then 400.
		* */
		if (UserRole.ADMIN === principal.role) {
			if (!request.companyId) {
				throw new BadRequestException(`${ApiConstant.MISSING_PARAM} : ${ApiConstant.COMPANY_ID}`);
			}
		}

		/*
		* If principal is O, then can create farm under same company. Property "companyId"
		* in payload should be replaced with principal's companyId, thereby removing
		* possibility for cross company reference.
		* */
		else if (UserRole.OWNER === principal.role) {
			request.companyId = principal.companyId;
		}

		const companyId: string = request.companyId;

		/* Verify that the company exists. */
		await this.assetService.fetchAssetByAssetId(companyId, AssetType.COMPANY);

		/*
		* Info: Valid value for companyId - request payload (ADMIN), principal.companyId (O)
		*
		* Users must belong to the same company as the companyId. Remove duplicate user id.
		* */
		if (!vu.isNullOrBlank(request.users)) {
			const companyUsers: UserInterface[] = await this.assetService.fetchAssetsByCompany(AssetType.USER,
				companyId);
			request.users = removeDuplicates(request.users);
			validateUsersByCompany(request.users, companyUsers);
		}
		const farmId: string = generateUUID();
		const farm: FarmInterface = request.mapFarm(farmId);
		await this.assetService.createAsset(farm);
		return farm;
	}

	async fetchFarms(principal: UserInterface, companyId: string): Promise<FarmInterface[]> {
		let farms: FarmInterface[] = [];
		/*
		* If principal is A and companyId is undefined, then fetch all farms.
		* If principal is A and companyId is defined, then fetch farms by company.
		* If principal is O, then fetch all farms within company.
		* If principal is M, then fetch assigned farms only.
		* */
		if (UserRole.ADMIN === principal.role) {
			if (companyId) {
				farms = await this.assetService.fetchAssetsByCompany(AssetType.FARM, companyId);
			} else {
				farms = await this.assetService.fetchAssetsByAssetType(AssetType.FARM);
			}
		} else if (CompanyRoles.includes(principal.role)) {
			farms = await this.assetService.fetchAssetsByCompany(AssetType.FARM, principal.companyId);
			if ([UserRole.MANAGER].includes(principal.role)) {
				farms = farms.filter((farm: FarmInterface) => farm.users.includes(principal.assetId));
			}
		}
		return farms;
	}

	async fetchFarmByFarmId(principal: UserInterface, farmId: string): Promise<FarmInterface> {
		const farm: FarmInterface = await this.assetService.fetchAssetByAssetId(farmId, AssetType.FARM);
		/**
		 * If principal is A, then fetch farm.
		 * If principal is O, then validate that farm is part of the company.
		 * If principal is M, then validate that they have direct access to the farm.
		 */
		if (CompanyRoles.includes(principal.role)) {
			if (farm.companyId !== principal.companyId) {
				throw new AccessDeniedException(`Access denied. Cannot fetch farm ${farmId}`);
			}
			if ([UserRole.MANAGER].includes(principal.role)) {
				validateFarmAccess(farm, principal.assetId);
			}
		}
		return farm;
	}

	async updateFarm(principal: UserInterface, farmId: string, request: FarmUpdateRequest): Promise<FarmInterface> {
		const prevFarm: FarmInterface = await this.fetchFarmByFarmId(principal, farmId);
		const newFarm: FarmInterface = request.mapFarm(prevFarm);

		if (!vu.isNullOrBlank(newFarm.users) && !vu.compareStringArray(prevFarm.users, newFarm.users)) {
			const companyUsers: UserInterface[] = await this.assetService.fetchAssetsByCompany(AssetType.USER,
				prevFarm.companyId);
			newFarm.users = removeDuplicates(newFarm.users);
			validateUsersByCompany(newFarm.users, companyUsers);
		}
		await this.assetService.updateAsset(newFarm);
		return newFarm;
	}

	async deleteFarm(principal: UserInterface, farmId: string): Promise<FarmInterface> {
		const farm: FarmInterface = await this.fetchFarmByFarmId(principal, farmId);
		// TODO: Ensure all resources under the farm are deleted.
		const sheds: ShedInterface[] = await this.assetService.fetchAssetsByFarm(AssetType.SHED, farmId);
		if (sheds.length > 0) {
			throw new AccessDeniedException(`Access denied. Farm containing sheds cannot be deleted.`);
		}
		await this.assetService.deleteAssetByAssetId(farmId, AssetType.FARM);
		return farm;
	}

	static getInstance(): FarmService {
		if (!FarmService.instance) {
			FarmService.instance = new FarmService();
		}
		return FarmService.instance;
	}
}
