export const convertToSeconds = (timestamp: number): number => {
	if ((timestamp + '').length > 10) {
		return Math.floor(timestamp / 1000);
	}
	return timestamp;
};

export const toMS = (timestamp: number): number => {
	if ((timestamp + '').length < 13) {
		return Math.floor(timestamp * 1000);
	}
	return timestamp;
};

/**
 * Convert timestamp to UTC
 *
 * @param timestamp: in milliseconds
 * @param offsetMS: in milliseconds
 */
export const toUTC = (timestamp: number, offsetMS: number): number => {
	return timestamp + offsetMS;
};

export const getTimezoneOffset = (timezone: string): number => {
	const date: Date = new Date();
	const s: string[] = date
		.toLocaleString('en-US', {hour12: false, timeZone: timezone})
		.split(/[/\s:]/);
	const arr: [number, number, number?, number?, number?, number?, number?] = [
		+s[2].replace(',', ''), +s[0] - 1, +s[1], +s[3], +s[4], +s[5]
	];
	const t1 = Date.UTC(...arr);
	const t2 = new Date(date).setMilliseconds(0);
	return (t2 - t1) / 60 / 1000;
};

/*function getTimezoneOffset(d, tz) {
	const a = d.toLocaleString("ja", {timeZone: tz}).split(/[/\s:]/);
	a[1]--;
	const t1 = Date.UTC.apply(null, a);
	const t2 = new Date(d).setMilliseconds(0);
	return (t2 - t1) / 60 / 1000;
}*/
