import { findAirport } from "./airports";

const USD_TO_INR = 88; // demo exchange rate

const DOMESTIC = [
  { code: "6E", name: "IndiGo", speed: 1.0, price: 0.95 },
  { code: "AI", name: "Air India", speed: 1.0, price: 1.15 },
  { code: "QP", name: "Akasa Air", speed: 1.0, price: 0.9 },
  { code: "SG", name: "SpiceJet", speed: 1.0, price: 0.85 },
  { code: "IX", name: "Air India Express", speed: 1.0, price: 0.88 },
];
const INTERNATIONAL = [
  { code: "EK", name: "Emirates", speed: 1.0, price: 1.3 },
  { code: "QR", name: "Qatar Airways", speed: 1.0, price: 1.25 },
  { code: "SQ", name: "Singapore Airlines", speed: 1.0, price: 1.35 },
  { code: "AI", name: "Air India", speed: 1.0, price: 1.05 },
  { code: "LH", name: "Lufthansa", speed: 1.0, price: 1.2 },
  { code: "BA", name: "British Airways", speed: 1.0, price: 1.28 },
  { code: "TG", name: "Thai Airways", speed: 1.0, price: 1.0 },
];

function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Same route + date always gives the same flights, so demos are repeatable.
export function generateMockFlights({ from, to, date, cabinClass = "ECONOMY", adults = 1 }) {
  const origin = findAirport(from);
  const dest = findAirport(to);
  if (!origin || !dest || origin.iataCode === dest.iataCode) return [];

  const rand = mulberry32(hashString(`${origin.iataCode}-${dest.iataCode}-${date}`));
  const km = Math.max(distanceKm(origin, dest), 150);
  const isDomestic = origin.countryName === "India" && dest.countryName === "India";
  const pool = isDomestic ? DOMESTIC : INTERNATIONAL;

  const cabinMult = { ECONOMY: 1, PREMIUM_ECONOMY: 1.6, BUSINESS: 3, FIRST: 4.5 }[cabinClass] || 1;
  const nonStopMinutes = Math.round((km / 780) * 60 + 35);
  const basePrice = isDomestic ? 25 + km * 0.045 : 90 + km * 0.055;
  const count = 10 + Math.floor(rand() * 4);

  const flights = [];
  for (let i = 0; i < count; i++) {
    const airline = pool[Math.floor(rand() * pool.length)];
    const stops = km < 900 ? (rand() < 0.1 ? 1 : 0) : rand() < 0.4 ? 1 : 0;
    const layover = stops ? 70 + Math.floor(rand() * 120) : 0;
    const durationMinutes = nonStopMinutes + layover + Math.floor(rand() * 20);

    const startHour = 5 + Math.floor(rand() * 18);
    const startMin = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][Math.floor(rand() * 12)];
    const depart = new Date(`${date}T00:00:00`);
    depart.setHours(startHour, startMin, 0, 0);
    const departureTs = depart.getTime();
    const arrivalTs = departureTs + durationMinutes * 60 * 1000;

    const stopDiscount = stops ? 0.85 : 1;
    const jitter = 0.8 + rand() * 0.5;
    const price = Math.round(basePrice * airline.price * stopDiscount * jitter * cabinMult * Math.max(1, adults));

    flights.push({
      id: `mock-${origin.iataCode}-${dest.iataCode}-${i}`,
      airline: { code: airline.code, name: airline.name },
      price: { amount: Math.round((price * USD_TO_INR) / 10) * 10, currency: "INR" },
      stops,
      durationMinutes,
      departure: { airport: origin.iataCode, timestamp: departureTs },
      arrival: { airport: dest.iataCode, timestamp: arrivalTs },
    });
  }
  return flights.sort((a, b) => a.departure.timestamp - b.departure.timestamp);
}
