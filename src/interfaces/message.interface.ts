import {DesiredInterface, ReportedMessage, ShadowInterface} from './shadow.interface';

interface MetaTimestamp {
	timestamp: number;
}

interface Metadata {
	desired: any;
	reported: {
		alarm: MetaTimestamp;
		alarmTS: MetaTimestamp;
	};
}

export interface ShadowUpdateEvent {
	previous: {
		state: {
			desired: DesiredInterface;
			reported: ShadowInterface;
		};
		metadata: Metadata;
		version: number;
	};
	current: {
		state: {
			desired: DesiredInterface;
			reported: ShadowInterface;
		};
		metadata: Metadata;
		version: number;
	};
	timestamp: number;
}

export interface MessageInterface {
	state: {
		reported: ReportedMessage;
	};
	topic: string;
	timestamp: number;
}
