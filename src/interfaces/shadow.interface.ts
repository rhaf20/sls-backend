export interface DesiredInterface {
	cOut: number;
	dur: number;
	freq: number;
	FW: number;
	inh: [number, number];
	iT: number[];
	nT: number[];
	pT: number[];
	sEn: boolean;
	SMSEn: number;
	SMSNum: string[];
	start: number;
	tR: number[];
}

export interface ShadowInterface {
	alarm: number;
	alarmTS: number;
	cOut: number;       // In seconds
	day: number;
	deviceId: string;
	devTS: number;
	dur: number;
	freq: number;
	FW: string;
	inh: [number, number];
	inhTS: [number, number];
	iT: number[];
	nT: number[];
	pT: number[];
	rT: number[];
	sEn: boolean;
	SMSEn: boolean;
	SMSNum: string[];
	sSq: boolean;
	start: number;      // In seconds
	tempTS: number;
	tR: number[];
}

export interface ReportedMessage {
	alarm: number;
	alarmTS: number;
	day: number;
	deviceId: string;
	devTS: number;
	inh: [number, number];
	inhTS: [number, number];
	rT: number[];
	tempTS: number;
}
