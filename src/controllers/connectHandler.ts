import { generateUUID, hasKey, notFoundResponse, okResponse } from '../utils';
import { EndpointConstant } from '../constants';
import { APIGatewayEvent } from 'aws-lambda';
import { ConnectService } from '../services/connect.service';
import { AlarmInterface } from '../interfaces';
import { AlarmService } from '../services/alarm.service';


const alarmService = AlarmService.getInstance();
const connectService = ConnectService.getInstance();

export const handler = async (event: any | APIGatewayEvent, context: any, callback: any): Promise<any> => {
	try {
		// Add log when call this lambda function
		console.log(JSON.stringify(event));

		if (hasKey(event, 'httpMethod')) {
			if (event.resource === EndpointConstant.VERIFY_CALL && event.httpMethod === 'POST') {
				return initiateVerificationCall(event);
			}
		} else if (hasKey(event, 'Details.ContactData')) {
			const attributes = event.Details.ContactData.Attributes;

			/* Ignore if verification call. */
			const alarmMessage: string = attributes.message;
			if (alarmMessage === 'This is a verification call.') {
				callback(null, { response: 'Thank you. Your phone number is verified.' });
			}

			const custInput: string = attributes.custInput;
			const deviceName: string = attributes.device;
			let userIndex: number = +attributes.userIndex;

			let response: string;
			if (custInput === '1') {
				await alarmService.suppressAlarm(attributes.deviceId);
				response = 'Thank you. The alarm will be silenced for 15 minutes.';
			} else if (custInput === '2') {
				const alarmId: string = attributes.alarmId;
				const alarm: AlarmInterface = await alarmService.fetchAlarmByAlarmId(alarmId);
				if (alarm) {
					userIndex = (userIndex + 1) % alarm.users.length;
					const phone: string = alarm.users[userIndex];

					// await sns.publishMessage(`[Alarm] ${deviceName}`, alarm.message, phone);
					/*await connect.initiateOutgoingCall(phone, {
						alarmId: alarm.alarmId,
						device: deviceName,
						message: alarm.message,
						phone,
						userIndex: userIndex + ''
					});*/
					console.log(`User ${phone} notified for ${deviceName} alarm`);

					await alarmService.updateAlarm(alarm);
				}
				response = 'Thank you. The next number on the list will be dialled.';
			} else {
				// TODO: Handle invalid input. Prompt user to re-enter correct option
			}
			callback(null, { response });
		}
	} catch (err) {
		console.error(err);
	}
};

const initiateVerificationCall = async (event: APIGatewayEvent): Promise<any> => {
	if (event.resource !== EndpointConstant.VERIFY_CALL) {
		return notFoundResponse();
	}
	const payload: { phoneNumber: string, deviceName: string } = JSON.parse(event.body);
	await connectService.initiateOutgoingCall(payload.phoneNumber, {
		alarmId: generateUUID(),
		device: payload.deviceName,
		message: 'This is a verification call.',
		phone: payload.phoneNumber,
		userIndex: '0'
	});
	return okResponse(null);
};
