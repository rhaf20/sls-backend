export interface DataPoint {
	alarm: number;
	assetId: string;
	day: number;
	inBatch: boolean;
	iT: number;
	nT: number;
	pT: number;
	rT: number;
	timestamp: number;
	tR: number;
}

export interface DataSeries {
	deviceId: string;
	shedId: string;
	farmId: string;
	companyId: string;
	points: DataPoint[];
}
