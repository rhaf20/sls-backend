import { APIGatewayEvent } from 'aws-lambda';
import { errorResponse, notFoundResponse, okResponse } from '../utils';
import { ApiConstant, EndpointConstant, RegexConstant } from '../constants';
import { ValidatorUtil as vu } from '../utils/validator.util';
import { AlarmInterface, DataSeries, MessageLog, UserInterface } from '../interfaces';
import { DataService } from '../services/data.service';


const dataService = DataService.getInstance();

export const handler = async (event: APIGatewayEvent): Promise<any> => {
	try {
		if (event.resource === EndpointConstant.DATA_ENDPOINT && event.httpMethod === 'GET') {
			const dataType: string = vu.validateParam(event.pathParameters, 'dataType', true, null);
			switch (dataType) {
				case 'alarm':
					return await fetchAlarmData(event);
				case 'sensor':
					return await fetchSensorData(event);
				case 'message':
					return await fetchMessageLog(event);
			}
		}
		return notFoundResponse(`Resource not found : [${event.httpMethod}] ${event.resource}`);
	} catch (err) {
		console.log(JSON.stringify(event));
		return errorResponse(err);
	}
};

const fetchAlarmData = async (event: APIGatewayEvent): Promise<any> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_DATA');
	const start: number = +event.queryStringParameters.start;
	const end: number = +event.queryStringParameters.end;
	const deviceId: string = vu.validateParam(event.queryStringParameters, ApiConstant.DEVICE_ID, true,
		RegexConstant.DEVICE_ID_PATTERN);
	const alarms: AlarmInterface[] = await dataService.fetchAlarmData(principal, deviceId, start, end);
	return okResponse(alarms);
};

const fetchSensorData = async (event: APIGatewayEvent): Promise<any> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_DATA');
	const start: number = +event.queryStringParameters.start;
	const end: number = +event.queryStringParameters.end;
	const deviceId: string = vu.validateParam(event.queryStringParameters, ApiConstant.DEVICE_ID, true,
		RegexConstant.DEVICE_ID_PATTERN);
	const dataSeries: DataSeries = await dataService.fetchSensorData(principal, deviceId, start, end);
	return okResponse(dataSeries);
};

const fetchMessageLog = async (event: APIGatewayEvent): Promise<any> => {
	const principal: UserInterface = vu.validatePrincipal(event, 'FETCH_MESSAGES');
	const start: number = +event.queryStringParameters.start;
	const end: number = +event.queryStringParameters.end;
	let deviceId: string = vu.validateParam(event.queryStringParameters, ApiConstant.DEVICE_ID, true,
		RegexConstant.DEVICE_ID_PATTERN);
	const response: MessageLog[] = await dataService.fetchMessageLog(principal, deviceId, start, end);
	return okResponse(response);
};
