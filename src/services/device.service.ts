import {AssetService} from './asset.service';
import {IotService} from './iot.service';
import {
	BuildingInterface,
	DeviceConfig,
	DeviceInterface,
	DeviceRegisterRequest,
	DeviceUpdateRequest,
	FarmInterface,
	ShedInterface,
	UserInterface
} from '../interfaces';
import {CreateThingResponse, DeleteThingResponse, DescribeThingResponse} from 'aws-sdk/clients/iot';
import {
	AccessDeniedException,
	compareObjects,
	convertToSeconds,
	deepClone,
	hasFarmAccess,
	hasKey,
	ResourceNotFoundException,
	validateFarmAccess
} from '../utils';
import {AssetType, CompanyRoles, DeviceStatus, UserRole} from '../enums';
import {ValidatorUtil as vu} from '../utils/validator.util';
import {RegexConstant} from '../constants';
import {DesiredInterface} from '../interfaces/shadow.interface';
import {AlarmService} from './alarm.service';


export class DeviceService {

	private static instance: DeviceService;

	private readonly alarmService: AlarmService;
	private readonly assetService: AssetService;
	private readonly iotService: IotService;

	private constructor() {
		this.alarmService = AlarmService.getInstance();
		this.assetService = AssetService.getInstance();
		this.iotService = IotService.getInstance();
	}

	async registerDevices(principal: UserInterface, requests: DeviceRegisterRequest[]): Promise<DeviceInterface[]> {
		const response: DeviceInterface[] = [];
		for (const request of requests) {
			let device: DeviceInterface = {
				assetId: request.assetId,
				assetType: AssetType.DEVICE,
			} as DeviceInterface;
			if (hasKey(request, 'enableCall')) {
				device.enableCall = false;
			}

			/* Validate that device does not exist in database */
			try {
				await this.fetchDeviceByDeviceId(principal, request.assetId);
				device.errorMessage = 'ALREADY_EXISTS';
				response.push(device);
				continue;
			} catch (err) {
				device = await this._createDevice(device, request);
				device.createdAt = device.updatedAt;
			}
			response.push(device);
		}
		return response;
	}

	async fetchDevices(principal: UserInterface, companyId: string, farmId: string, shedId: string): Promise<DeviceInterface[]> {
		let devices: DeviceInterface[] = [];

		/*
		* If principal is A and shedId is defined, then fetch all devices by shed.
		* If principal is A and farmId is defined, then fetch all devices by farm.
		* If principal is A and companyId is defined, then fetch all devices by company.
		* If principal is A and no filter, then fetch all devices.
		* */
		if (UserRole.ADMIN === principal.role) {
			if (shedId) {
				devices = await this.assetService.fetchAssetsByShed(AssetType.DEVICE, shedId);
			} else if (farmId) {
				devices = await this.assetService.fetchAssetsByFarm(AssetType.DEVICE, farmId);
			} else if (companyId) {
				devices = await this.assetService.fetchAssetsByCompany(AssetType.DEVICE, companyId);
			} else {
				devices = await this.assetService.fetchAssetsByAssetType(AssetType.DEVICE);
			}
		}

		/* For company roles */
		else if (CompanyRoles.includes(principal.role)) {
			/*
			* If shedId is defined,
			*   If shed does not exist, then 400.
			*   Else if principal is O and shed does not belong to principal's company, then 403.
			*   Else if principal is M and principal is not assigned to farm, then 403.
			*   Else, fetch devices by shed.
			* */
			if (shedId) {
				const field: ShedInterface = await this.assetService.fetchAssetByAssetId(shedId, AssetType.SHED);
				if (UserRole.OWNER === principal.role && field.companyId !== principal.companyId) {
					throw new AccessDeniedException(`Access denied. Cannot access shed ${shedId}`);
				}
				if ([UserRole.MANAGER].includes(principal.role)) {
					const farm: FarmInterface = await this.assetService.fetchAssetByAssetId(field.farmId,
						AssetType.FARM);
					if (!validateFarmAccess(farm, principal.assetId)) {
						throw new AccessDeniedException(`Access denied. Cannot access field ${shedId}`);
					}
				}
				devices = await this.assetService.fetchAssetsByShed(AssetType.DEVICE, shedId);
			}

			/*
			* If farmId is defined,
			*   If farm does not exist, then 400.
			*   Else if principal is O and farm does not belong to principal's company, then 403.
			*   Else if principal is M and principal is not assigned to farm, then 403.
			*   Else, fetch devices by farm.
			* */
			else if (farmId) {
				const farm: FarmInterface = await this.assetService.fetchAssetByAssetId(farmId, AssetType.FARM);
				const isInvalidOwner: boolean = UserRole.OWNER === principal.role && farm.companyId !== principal.companyId;
				const isInvalidManager: boolean = [UserRole.MANAGER].includes(principal.role) && !validateFarmAccess(
					farm, principal.assetId);
				if (isInvalidOwner || isInvalidManager) {
					throw new AccessDeniedException(`Access denied. Cannot access farm ${farmId}`);
				}
				devices = await this.assetService.fetchAssetsByFarm(AssetType.DEVICE, farmId);
			}

			/*
			* If principal is O, then fetch all devices under company.
			* Else if principal is M, then fetch all devices from assigned farms.
			* */
			else {
				if (UserRole.OWNER === principal.role) {
					devices = await this.assetService.fetchAssetsByCompany(AssetType.DEVICE, principal.companyId);
				} else {
					const farms: FarmInterface[] = await this.assetService.fetchAssetsByCompany(AssetType.FARM,
						principal.companyId);
					for (const farm of farms) {
						if (validateFarmAccess(farm, principal.assetId)) {
							const _devices: DeviceInterface[] = await this.assetService
								.fetchAssetsByFarm(AssetType.DEVICE, farm.assetId);
							devices = devices.concat(_devices);
						}
					}
				}
			}
		}

		// TODO : Fetch devices for CONSULTANT
		/* For CONSULTANT role, fetch preference and filter assigned devices */
		/*else if (UserRole.CONSULTANT === principal.role) {
			const preference: PreferenceInterface = await fetchPreference(principal.assetId, this.assetService);
			if (preference && preference.devices) {
				devices = await this.assetService.fetchAssetsByAssetIds(preference.devices, AssetType.DEVICE);
			}
		}
		*/
		return devices;
	}

	async fetchDeviceByDeviceId(principal: UserInterface, deviceId: string): Promise<DeviceInterface> {
		/*
		* If principal is A, then fetch device.
		* If principal is O, then verify device belongs to same company.
		* If principal is M, then validate that they have access to device's farm.
		* If principal is C, then validate that they have access to device.
		* */
		// TODO : Fetch device for CONSULTANT
		/*if (UserRole.RESEARCHER === principal.role) {
			const hasAccess: boolean = await authoriseResearcherDevice(principal.assetId, deviceId, this.assetService);
			if (!hasAccess) {
				throw new AccessDeniedException(`Access denied. Cannot access device ${deviceId}`);
			}
		}*/

		const device: DeviceInterface = await this.assetService.fetchAssetByAssetId(deviceId, AssetType.DEVICE);

		if (CompanyRoles.includes(principal.role)) {
			if (device.companyId !== principal.companyId) {
				throw new AccessDeniedException(`Access denied. Cannot access device ${deviceId}`);
			}
			if ([UserRole.MANAGER].includes(principal.role)) {
				const farm: FarmInterface = await this.assetService.fetchAssetByAssetId(device.farmId, AssetType.FARM);
				validateFarmAccess(farm, principal.assetId);
			}
		}
		return device;
	}

	async suppressAlarm(principal: UserInterface, deviceId: string): Promise<void> {
		/* Validate access to device */
		const device: DeviceInterface = await this.fetchDeviceByDeviceId(principal, deviceId);

		/* Suppress alarm */
		await this.alarmService.suppressAlarm(device.assetId);
	}

	async updateDevice(principal: UserInterface, deviceId: string, request: DeviceUpdateRequest): Promise<DeviceInterface> {
		const device: DeviceInterface = await this.fetchDeviceByDeviceId(principal, deviceId);

		/* Validate access to hierarchy */
		await this._validateAssetHierarchy(principal, device, request);

		const response: DeviceInterface = await this._updateDeviceProperties(device, request);
		const payload: { state: { desired: DesiredInterface } } = prepareConfig(response, request);
		if (payload) {
			await this.iotService.updateDeviceShadow(deviceId, payload);
		}
		await this.assetService.updateAsset(response);
		return response;
	}

	async deleteDevice(principal: UserInterface, deviceId: string): Promise<DeviceInterface> {
		await this.fetchDeviceByDeviceId(principal, deviceId);
		return this._deleteDevice(deviceId);
	}

	private async _createDevice(device: DeviceInterface, request: DeviceRegisterRequest): Promise<DeviceInterface> {
		const deviceId: string = device.assetId.toUpperCase();

		/* Validate deviceId */
		if (!vu.validateStringPattern(deviceId, RegexConstant.DEVICE_ID_PATTERN)) {
			device.errorMessage = 'INVALID_ID';
			return device;
		}

		let createThingResponse: CreateThingResponse;
		try {
			/* Validate that thing does not exist in IoT Core */
			const describeThingResponse: DescribeThingResponse = await this.iotService.fetchThingWrapper(deviceId);
			if (describeThingResponse) {
				device.errorMessage = 'ALREADY_EXISTS';
				return device;
			}

			/* Create thing */
			createThingResponse = await this.iotService.createThing(deviceId);

			/* Set device properties */
			device = await this._updateDeviceProperties(device, request);
			device.createdAt = device.updatedAt;
			await this.assetService.createAsset(device);
		} catch (err) {
			console.error(JSON.stringify(err));
			if (createThingResponse) {
				await this.iotService.deleteThing(deviceId);
			}
			delete device.assetStatus;
			delete device.createdAt;
			delete device.updatedAt;
			device.errorMessage = 'ALREADY_EXISTS';
		}
		return device;
	}

	private async _updateDeviceProperties(prevDevice: DeviceInterface,
	                                      request: DeviceRegisterRequest | DeviceUpdateRequest): Promise<DeviceInterface> {
		let device: DeviceInterface;
		const timestamp: number = Date.now();
		device = deepClone(prevDevice);

		/* Compare hierarchy */
		await compareShed(device, request, this.assetService);

		setDefaultValues(device, request);

		device.updatedAt = timestamp;
		return device;
	}

	private async _deleteDevice(deviceId: string): Promise<DeviceInterface> {
		let device: DeviceInterface = {
			assetId: deviceId,
			assetType: AssetType.DEVICE,
		} as DeviceInterface;
		let deleteThingResponse: DeleteThingResponse;
		try {
			device = await this.assetService.fetchAssetByAssetId(deviceId, AssetType.DEVICE);
			/*
			* If devices are registered, then delete devices.
			* Else, set errorMessage in response.
			* */
			if (DeviceStatus.REGISTERED === device.assetStatus) {

				/* Verify that thing exists */
				await this.iotService.fetchThing(deviceId);

				/* Delete resources */
				await this.assetService.deleteAssetByAssetId(deviceId, AssetType.DEVICE);
				deleteThingResponse = await this.iotService.deleteThing(deviceId);
				device.assetStatus = DeviceStatus.DELETED;
			} else {
				device.errorMessage = `ALREADY_${device.assetStatus}`;
			}
		} catch (err) {
			if (err instanceof ResourceNotFoundException || err.code === 'ResourceNotFoundException') {
				device.errorMessage = 'DOES_NOT_EXIST';
			} else if (!deleteThingResponse) {
				device.errorMessage = 'DELETE_FAILED';
				await this.assetService.createAsset(device);
			}
		}
		return device;
	}

	private async _validateAssetHierarchy(principal: UserInterface, device: DeviceInterface, request: DeviceUpdateRequest): Promise<void> {
		if (vu.notNull(request.shedId) && device.shedId !== request.shedId) {
			const newShed: ShedInterface = await this.assetService.fetchAssetByAssetId(request.shedId, AssetType.SHED);
			request.farmId = newShed.farmId;
			request.companyId = newShed.companyId;
		}

		if (vu.notNull(request.farmId) && device.farmId !== request.farmId) {
			const newFarm: FarmInterface = await this.assetService.fetchAssetByAssetId(request.farmId, AssetType.FARM);
			hasFarmAccess(newFarm, principal);
			request.companyId = newFarm.companyId;
		}

		if (vu.notNull(request.companyId) && device.companyId !== request.companyId) {
			await this.assetService.fetchAssetByAssetId(request.companyId, AssetType.COMPANY);
		}
	}

	static getInstance(): DeviceService {
		if (!DeviceService.instance) {
			DeviceService.instance = new DeviceService();
		}
		return DeviceService.instance;
	}
}

const prepareConfig = (device: DeviceInterface, request: DeviceUpdateRequest): { state: { desired: DesiredInterface } } => {
	if (vu.isNull(request.config)) {
		return null;
	}
	const config: DeviceConfig = request.config;
	const desired: DesiredInterface = {} as DesiredInterface;
	if (config.cOut !== device.cOut) {
		config.cOut = convertToSeconds(config.cOut);
		device.cOut = config.cOut;
		desired.cOut = config.cOut;
	}
	// Duration is not part of the device-update request. It is determined directly from start and cOut properties.
	/*if (config.dur !== device.dur) {
		device.dur = config.dur;
		desired.dur = config.dur;
	}*/
	if (config.freq !== device.freq) {
		device.freq = config.freq;
		desired.freq = config.freq;
	}
	if (!compareObjects(config.iT, device.iT)) {
		device.iT = config.iT;
		desired.iT = config.iT;
	}
	if (!compareObjects(config.nT, device.nT)) {
		device.nT = config.nT;
		desired.nT = config.nT;
	}
	if (!compareObjects(config.pT, device.pT)) {
		device.pT = config.pT;
		desired.pT = config.pT;
	}
	if (config.sEn !== device.sEn) {
		device.sEn = config.sEn;
		desired.sEn = config.sEn;
	}
	if (config.SMSEn !== device.SMSEn) {
		device.SMSEn = config.SMSEn;
		desired.SMSEn = config.SMSEn ? 1 : 0;
	}
	if (!compareObjects(config.SMSNum, device.SMSNum)) {
		device.SMSNum = config.SMSNum;
		desired.SMSNum = config.SMSNum;
	}
	if (config.sSq !== device.sSq) {
		device.sSq = config.sSq;
	}
	if (config.start !== device.start) {
		config.start = convertToSeconds(config.start);
		device.start = config.start;
		desired.start = config.start;
	}
	if (!compareObjects(config.tR, device.tR)) {
		device.tR = config.tR;
		desired.tR = config.tR;
	}
	if (Object.keys(desired).length > 0) {
		if (desired.start || desired.cOut) {
			device.dur = getDuration(config.start, config.cOut);
			desired.dur = device.dur;
		}
		return {state: {desired}};
	}
	return null;
};

const getDuration = (start: number, cOut: number): number => {
	return Math.round(Math.abs(cOut - start) / 86400);
	// return Math.round(Math.abs(cOut - start) / 86400 * 1000);
};

const setDefaultValues = (device: DeviceInterface, request: DeviceRegisterRequest | DeviceUpdateRequest): void => {
	/* assetName */
	if (request.assetName && request.assetName.trim().length > 0) {
		device.assetName = request.assetName;
	} else if (!device.assetName) {
		device.assetName = device.assetId;
	}

	if (vu.notNull(request.enableCall)) {
		device.enableCall = request.enableCall;
	}

	/* templateId */
	if (request.templateId) {
		device.templateId = request.templateId;
	}
};

/**
 *  No.     Device          Request         Result
 *  --      ------          -------         ------
 *  1.      Undefined       Undefined       REGISTERED
 *  2.      Undefined       Company 1       Assign Company
 *  3.      Undefined       Company 2       Assign Company
 *  4.      Company1        Undefined       REGISTERED
 *  5.      Company1        Company1        No change
 *  6.      Company1        Company2        Company has changed. Update companyId
 *
 * @param device : DeviceType
 * @param request : DeviceRegisterRequest
 * @param assetService : AssetService
 */
const compareCompany = async (device: DeviceInterface, request: DeviceRegisterRequest | DeviceUpdateRequest,
                              assetService: AssetService): Promise<void> => {

	// Case 1, 4
	if (!request.companyId) {
		delete device.companyId;
		device.assetStatus = DeviceStatus.REGISTERED;
	}

	// Case 2, 3, 6
	else if (request.companyId && device.companyId !== request.companyId) {
		const company: BuildingInterface = await assetService.fetchAssetByAssetId(request.companyId, AssetType.COMPANY);
		device.companyId = company.assetId;
		device.assetStatus = DeviceStatus.ASSIGNED;
	}
};

/**
 *  No.     Device          Request         Result
 *  --      ------          -------         ------
 *  1.      Undefined       Undefined       Compare company
 *  2.      Undefined       Farm 1          Assign farm
 *  3.      Undefined       Farm 2          Assign farm
 *  4.      Farm1           Undefined       Compare company
 *  5.      Farm1           Farm1           No change
 *  6.      Farm1           Farm2           Farm has changed. Update farmId and companyId
 *
 * @param device : DeviceType
 * @param request : DeviceRegisterRequest
 * @param assetService : AssetService
 */
const compareFarm = async (device: DeviceInterface, request: DeviceRegisterRequest | DeviceUpdateRequest,
                           assetService: AssetService): Promise<void> => {

	// Case 1, 4
	if (!request.farmId) {
		delete device.farmId;
		await compareCompany(device, request, assetService);
	}

	// Case 2, 3, 6
	else if (request.farmId && device.farmId !== request.farmId) {
		const farm: FarmInterface = await assetService.fetchAssetByAssetId(request.farmId, AssetType.FARM);
		device.farmId = farm.assetId;
		device.companyId = farm.companyId;
		device.assetStatus = DeviceStatus.ASSIGNED;
	}
};

/**
 *  No.     Device          Request         Result
 *  --      ------          -------         ------
 *  1.      Undefined       Undefined       REGISTERED -> Compare farm
 *  2.      Undefined       Field1          ACTIVE
 *  3.      Undefined       Field2          ACTIVE
 *  4.      Field1          Undefined       REGISTERED -> Compare farm
 *  5.      Field1          Field1          No change
 *  6.      Field1          Field2          Field has changed. Update fieldId, farmId and companyId.
 *
 *  Note: Shadow properties are not updated. In case of change of field, device is will update shadow upon connecting.
 *
 * @param device : DeviceType
 * @param request : DeviceRegisterRequest
 * @param assetService : AssetService
 */
const compareShed = async (device: DeviceInterface, request: DeviceRegisterRequest | DeviceUpdateRequest,
                           assetService: AssetService): Promise<void> => {

	// Case 1, 4
	if (!request.shedId) {
		delete device.shedId;
		await compareFarm(device, request, assetService);
	}

	// Case 2, 3, 6
	else if (request.shedId && device.shedId !== request.shedId) {
		const shed: ShedInterface = await assetService.fetchAssetByAssetId(request.shedId, AssetType.SHED);
		device.shedId = shed.assetId;
		device.farmId = shed.farmId;
		device.companyId = shed.companyId;
		device.assetStatus = DeviceStatus.ACTIVE;
	}
};
