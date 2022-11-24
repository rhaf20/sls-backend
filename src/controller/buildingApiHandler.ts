import { APIGatewayEvent } from 'aws-lambda';
import { errorResponse, notFoundResponse, okResponse } from '../utils';
import { ValidatorUtil as vu } from '../utils/validator.util';
import { ApiConstant, EndpointConstant, RegexConstant } from '../constants';
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
import { CompanyService } from '../services/company.service';
import { FarmService } from '../services/farm.service';
import { ShedService } from '../services/shed.service';
import { DeviceService } from '../services/device.service';
import { AssetType } from '../enums';
import { TemplateService } from '../services/template.service';
import { TemplateCreateRequest, TemplateUpdateRequest } from '../interfaces/requests/template.request';


const companyService = CompanyService.getInstance();
const deviceService = DeviceService.getInstance();
const farmService = FarmService.getInstance();
const shedService = ShedService.getInstance();
const templateService = TemplateService.getInstance();

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    try {
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
        }
        return notFoundResponse(`Resource not found : [${event.httpMethod}] ${event.resource}`);
    } catch (err) {
        console.log(JSON.stringify(event));
        return errorResponse(err);
    }
};

const registerDevices = async (event: APIGatewayEvent): Promise<any> => {
    const principal: UserInterface = vu.validatePrincipal(event, 'CREATE_BUILDING');
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
