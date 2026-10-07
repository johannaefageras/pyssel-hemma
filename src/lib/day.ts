/*
 * "Today" for the house. The server may run in another time zone and phones
 * may be travelling, so the calendar day is always taken in Europe/Stockholm.
 */

const TIME_ZONE = 'Europe/Stockholm';

/** The house's calendar day as YYYY-MM-DD, which is also how Postgres stores a date. */
export function houseDay(now: Date = new Date()): string {
	// The Swedish locale formats dates as 2026-10-07.
	return new Intl.DateTimeFormat('sv-SE', {
		timeZone: TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
}

/** "onsdag 7 oktober" */
export function houseDateLabel(now: Date = new Date()): string {
	return new Intl.DateTimeFormat('sv-SE', {
		timeZone: TIME_ZONE,
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	}).format(now);
}
