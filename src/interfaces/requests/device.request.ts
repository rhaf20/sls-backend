export interface DeviceRegisterRequest {
	assetId: string;
	assetName: string;

	/* Hierarchy */
	shedId: string;
	farmId: string;
	companyId: string;

	enableCall: boolean;
	templateId: string;
}

export interface DeviceConfig {
	cOut: number;       // In device timezone
	// dur: number;
	freq: number;
	iT: number[];
	nT: number[];
	pT: number[];
	sEn: boolean;
	SMSEn: boolean;
	SMSNum: string[];
	sSq: boolean;
	start: number;      // In device timezone
	tR: number[];
}

export interface DeviceUpdateRequest {
	assetName: string;

	/* Hierarchy */
	shedId: string;
	farmId: string;
	companyId: string;

	enableCall: boolean;
	templateId: string;

	config: DeviceConfig;
}
