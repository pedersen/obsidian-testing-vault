export function randomInt(min: number, max: number, power: number = 1): number {
	return Math.floor(Math.pow(Math.random() * (max - min + 1), power)) + min;
}

export function randomSubset(arr: Array<any>, size: number): Array<any> {
	let shuffled = arr.slice(0), i = arr.length, temp, index;
	while (i--) {
		index = Math.floor((i + 1) * Math.random());
		temp = shuffled[index];
		shuffled[index] = shuffled[i];
		shuffled[i] = temp;
	}
	return shuffled.slice(0, size);
}

export function randomChoice(arr: Array<any>): any {
	return arr[randomInt(0, arr.length - 1)];
}

export function randomDateInRange(start: Date, end: Date): Date {
	const range = end.getTime() - start.getTime();
	const newMs = randomInt(0, range);
	return new Date(start.getTime() + newMs);
}
