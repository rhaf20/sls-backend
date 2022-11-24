import {APIGatewayEvent} from 'aws-lambda';
import {errorResponse, notFoundResponse, okResponse} from '../utils';
import {ValidatorUtil as vu} from '../utils/validator.util';
import {ApiConstant, EndpointConstant, RegexConstant} from '../constants';
import {
	BuildingCreateRequest,
	BuildingInterface,
	CompanyUpdateRequest,
	DeviceInterface,
	DeviceRegisterRequest,
	DeviceUpdateRequest,
	FarmCreateRequest,
	FarmInterface,
	FarmUpdateRequest,
	ShedCreateRequest,
	ShedInterface,
	ShedUpdateRequest,
	TemplateInterface,
	UserInterface
} from '../interfaces';
import {CompanyService} from '../services/company.service';
import {FarmService} from '../services/farm.service';
import {ShedService} from '../services/shed.service';
import {DeviceService} from '../services/device.service';
import {AssetType} from '../enums';
import {TemplateService} from '../services/template.service';
import {TemplateCreateRequest, TemplateUpdateRequest} from '../interfaces/requests/template.request';


const companyService = CompanyService.getInstance();
const deviceService = DeviceService.getInstance();
const farmService = FarmService.getInstance();
const shedService = ShedService.getInstance();
const templateService = TemplateService.getInstance();

export const handler = async (event: APIGatewayEvent): Promise<any> => {
	try {
		const assetType: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_TYPE, true,
			null).toUpperCase();
		let response: any;
		switch (assetType) {
			case AssetType.COMPANY:
				response = await companyHandler(event);
				break;
			case AssetType.FARM:
				response = await farmHandler(event);
				break;
			case AssetType.SHED:
				response = await shedHandler(event);
				break;
			case AssetType.DEVICE:
				response = await deviceHandler(event);
				break;
			case AssetType.TEMPLATE:
				response = await templateHandler(event);
				break;
		}
		if (response) {
			return response;
		}
		return notFoundResponse(`Resource not found : [${event.httpMethod}] ${event.resource}`);
	} catch (err) {
		console.log(JSON.stringify(event));
		return errorResponse(err);
	}
};

/* Device */
const deviceHandler = async (event: APIGatewayEvent): Promise<any> => {
	switch (event.resource) {
		case EndpointConstant.ASSET_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchDevices(event);
			} else if (event.httpMethod === 'POST') {
				return await registerDevices(event);
			}
			break;
		case EndpointConstant.ASSET_DETAIL_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchDeviceById(event);
			} else if (event.httpMethod === 'PUT') {
				return await updateDevice(event);
			} else if (event.httpMethod === 'DELETE') {
				return await deleteDevice(event);
			}
			break;
		case EndpointConstant.ASSET_ACTION_ENDPOINT:
			const action: string = vu.validateParam(event.queryStringParameters, ApiConstant.ACTION,
				true, null).toUpperCase();
			if (action === 'SUPPRESS') {
				return await suppressAlarm(event);
			}
			break;
	}
	return null;
};

const registerDevices = async (event: APIGatewayEvent): Promise<any> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'REGISTER_DEVICES');
	const request: DeviceRegisterRequest[] = JSON.parse(event.body);
	const response: DeviceInterface[] = await deviceService.registerDevices(principal, request);
	return okResponse(response);
};

const fetchDevices = async (event: APIGatewayEvent): Promise<DeviceInterface[]> => {
	const companyId: string = vu.validateParam(event.queryStringParameters, ApiConstant.COMPANY_ID, false,
		RegexConstant.UUID_PATTERN);
	const farmId: string = vu.validateParam(event.queryStringParameters, ApiConstant.FARM_ID, false,
		RegexConstant.UUID_PATTERN);
	const shedId: string = vu.validateParam(event.queryStringParameters, ApiConstant.SHED_ID, false,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_DEVICES');
	const devices: DeviceInterface[] = await deviceService.fetchDevices(principal, companyId, farmId, shedId);
	return okResponse(devices);
};

const fetchDeviceById = async (event: APIGatewayEvent): Promise<DeviceInterface> => {
	const deviceId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.DEVICE_ID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_DEVICE');
	const device: DeviceInterface = await deviceService.fetchDeviceByDeviceId(principal, deviceId);
	return okResponse(device);
};

const updateDevice = async (event: APIGatewayEvent): Promise<DeviceInterface> => {
	const deviceId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.DEVICE_ID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_DEVICE');
	const request: DeviceUpdateRequest = JSON.parse(event.body);
	const device: DeviceInterface = await deviceService.updateDevice(principal, deviceId, request);
	return okResponse(device);
};

const deleteDevice = async (event: APIGatewayEvent): Promise<DeviceInterface> => {
	const deviceId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.DEVICE_ID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'DELETE_DEVICE');
	const device: DeviceInterface = await deviceService.deleteDevice(principal, deviceId);
	return okResponse(device);
};

const suppressAlarm = async (event: APIGatewayEvent): Promise<any> => {
	const deviceId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.DEVICE_ID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'SUPPRESS_ALARM');
	await deviceService.suppressAlarm(principal, deviceId);
	return okResponse(null);
};

/* Template */
const templateHandler = async (event: APIGatewayEvent): Promise<any> => {
	switch (event.resource) {
		case EndpointConstant.ASSET_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchTemplates(event);
			} else if (event.httpMethod === 'POST') {
				return await createTemplate(event);
			}
			break;
		case EndpointConstant.ASSET_DETAIL_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchTemplateById(event);
			} else if (event.httpMethod === 'PUT') {
				return await updateTemplate(event);
			} else if (event.httpMethod === 'DELETE') {
				return await deleteTemplate(event);
			}
			break;
	}
	return null;
};

const createTemplate = async (event: APIGatewayEvent): Promise<any[]> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'CREATE_TEMPLATE');
	const request: TemplateCreateRequest = new TemplateCreateRequest(event.body);
	const template: TemplateInterface = await templateService.createTemplate(principal, request);
	return okResponse(template);
};

const fetchTemplates = async (event: APIGatewayEvent): Promise<any[]> => {
	const companyId: string = vu.validateParam(event.queryStringParameters, ApiConstant.COMPANY_ID, false,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_TEMPLATES');
	const templates: TemplateInterface[] = await templateService.fetchTemplates(principal, companyId);
	return okResponse(templates);
};

const fetchTemplateById = async (event: APIGatewayEvent): Promise<any> => {
	const templateId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_TEMPLATE');
	const template: TemplateInterface = await templateService.fetchTemplateByTemplateId(principal, templateId);
	return okResponse(template);
};

const updateTemplate = async (event: APIGatewayEvent): Promise<any> => {
	const templateId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'UPDATE_TEMPLATE');
	const request: TemplateUpdateRequest = new TemplateUpdateRequest(event.body);
	const template: TemplateInterface = await templateService.updateTemplate(principal, templateId, request);
	return okResponse(template);
};

const deleteTemplate = async (event: APIGatewayEvent): Promise<any> => {
	const templateId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'DELETE_TEMPLATE');
	const template: TemplateInterface = await templateService.deleteTemplate(principal, templateId);
	return okResponse(template);
};

/* Company */
const companyHandler = async (event: APIGatewayEvent): Promise<any> => {
	switch (event.resource) {
		case EndpointConstant.ASSET_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchCompanies(event);
			} else if (event.httpMethod === 'POST') {
				return await createCompany(event);
			}
			break;
		case EndpointConstant.ASSET_DETAIL_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchCompanyById(event);
			} else if (event.httpMethod === 'PUT') {
				return await updateCompany(event);
			} else if (event.httpMethod === 'DELETE') {
				return await deletCompany(event);
			}
			break;
	}
	return null;
};

const createCompany = async (event: APIGatewayEvent): Promise<BuildingInterface> => {
	vu.validatePrincipal(event, 'CREATE_COMPANY');
	const request: BuildingCreateRequest = new BuildingCreateRequest(event.body);
	const company: BuildingInterface = await companyService.createCompany(request);
	return okResponse(company);
};

const fetchCompanies = async (event: APIGatewayEvent): Promise<BuildingInterface[]> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_COMPANIES');
	const companies: BuildingInterface[] = await companyService.fetchCompanies(principal);
	return okResponse(companies);
};

const fetchCompanyById = async (event: APIGatewayEvent): Promise<any> => {
	const companyId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_COMPANY');
	const company: BuildingInterface = await companyService.fetchCompanyById(principal, companyId);
	return okResponse(company);
};

const updateCompany = async (event: APIGatewayEvent): Promise<any> => {
	const companyId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'UPDATE_COMPANY');
	const request: CompanyUpdateRequest = new CompanyUpdateRequest(event.body);
	const company: BuildingInterface = await companyService.updateCompany(principal, companyId, request);
	return okResponse(company);
};

const deletCompany = async (event: APIGatewayEvent): Promise<any> => {
	const companyId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'DELETE_COMPANY');
	const company: BuildingInterface = await companyService.deleteCompany(principal, companyId);
	return okResponse(company);
};

/* Farm */
const farmHandler = async (event: APIGatewayEvent): Promise<any> => {
	switch (event.resource) {
		case EndpointConstant.ASSET_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchFarms(event);
			} else if (event.httpMethod === 'POST') {
				return await createFarm(event);
			}
			break;
		case EndpointConstant.ASSET_DETAIL_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchFarmById(event);
			} else if (event.httpMethod === 'PUT') {
				return await updateFarm(event);
			} else if (event.httpMethod === 'DELETE') {
				return await deleteFarm(event);
			}
			break;
	}
	return null;
};

const createFarm = async (event: APIGatewayEvent): Promise<FarmInterface> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'CREATE_FARM');
	const request: FarmCreateRequest = new FarmCreateRequest(event.body);
	const farm: FarmInterface = await farmService.createFarm(request, principal);
	return okResponse(farm);
};

const fetchFarms = async (event: APIGatewayEvent): Promise<FarmInterface[]> => {
	const companyId: string = vu.validateParam(event.queryStringParameters, ApiConstant.COMPANY_ID, false,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_FARMS');
	const farms: FarmInterface[] = await farmService.fetchFarms(principal, companyId);
	return okResponse(farms);
};

const fetchFarmById = async (event: APIGatewayEvent): Promise<any> => {
	const farmId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_FARM');
	const farm: FarmInterface = await farmService.fetchFarmByFarmId(principal, farmId);
	return okResponse(farm);
};

const updateFarm = async (event: APIGatewayEvent): Promise<any> => {
	const farmId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'UPDATE_FARM');
	const request: FarmUpdateRequest = new FarmUpdateRequest(event.body);
	const farm: FarmInterface = await farmService.updateFarm(principal, farmId, request);
	return okResponse(farm);
};

const deleteFarm = async (event: APIGatewayEvent): Promise<any> => {
	const farmId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'DELETE_FARM');
	const farm: FarmInterface = await farmService.deleteFarm(principal, farmId);
	return okResponse(farm);
};

/* Shed */
const shedHandler = async (event: APIGatewayEvent): Promise<any> => {
	switch (event.resource) {
		case EndpointConstant.ASSET_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchSheds(event);
			} else if (event.httpMethod === 'POST') {
				return await createShed(event);
			}
			break;
		case EndpointConstant.ASSET_DETAIL_ENDPOINT:
			if (event.httpMethod === 'GET') {
				return await fetchShedById(event);
			} else if (event.httpMethod === 'PUT') {
				return await updateShed(event);
			} else if (event.httpMethod === 'DELETE') {
				return await deleteShed(event);
			}
			break;
	}
	return null;
};

const createShed = async (event: APIGatewayEvent): Promise<ShedInterface> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'CREATE_SHED');
	const request: ShedCreateRequest = new ShedCreateRequest(event.body);
	const shed: ShedInterface = await shedService.createShed(request, principal);
	return okResponse(shed);
};

const fetchSheds = async (event: APIGatewayEvent): Promise<ShedInterface[]> => {
	const companyId: string = vu.validateParam(event.queryStringParameters, ApiConstant.COMPANY_ID, false,
		RegexConstant.UUID_PATTERN);
	const farmId: string = vu.validateParam(event.queryStringParameters, ApiConstant.FARM_ID, false,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_SHEDS');
	const sheds: ShedInterface[] = await shedService.fetchSheds(principal, companyId, farmId);
	return okResponse(sheds);
};

const fetchShedById = async (event: APIGatewayEvent): Promise<ShedInterface> => {
	const shedId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_SHED');
	const shed: ShedInterface = await shedService.fetchShedByShedId(principal, shedId);
	return okResponse(shed);
};

const updateShed = async (event: APIGatewayEvent): Promise<ShedInterface> => {
	const shedId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'UPDATE_SHED');
	const request: ShedUpdateRequest = new ShedUpdateRequest(event.body);
	const shed: ShedInterface = await shedService.updateShed(principal, shedId, request);
	return okResponse(shed);
};

const deleteShed = async (event: APIGatewayEvent): Promise<ShedInterface> => {
	const shedId: string = vu.validateParam(event.pathParameters, ApiConstant.ASSET_ID, true,
		RegexConstant.UUID_PATTERN);
	const principal: UserInterface = vu.validatePrincipal(event, 'DELETE_SHED');
	const shed: ShedInterface = await shedService.deleteShed(principal, shedId);
	return okResponse(shed);
};
