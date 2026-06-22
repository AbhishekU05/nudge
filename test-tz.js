const tz = 'America/New_York';
const d = new Date();
const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', hour12: false });
console.log(formatter.format(d));
