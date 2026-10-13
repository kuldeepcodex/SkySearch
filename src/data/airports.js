// Local airport list used when no Amadeus API keys are configured.
export const AIRPORTS = [
  // India
  { iataCode: "DEL", aliases: ["Delhi"], name: "Indira Gandhi International Airport", cityName: "New Delhi", countryName: "India", lat: 28.5562, lon: 77.1 },
  { iataCode: "BOM", aliases: ["Bombay"], name: "Chhatrapati Shivaji Maharaj International Airport", cityName: "Mumbai", countryName: "India", lat: 19.0896, lon: 72.8656 },
  { iataCode: "BLR", aliases: ["Bangalore"], name: "Kempegowda International Airport", cityName: "Bengaluru", countryName: "India", lat: 13.1986, lon: 77.7066 },
  { iataCode: "HYD", name: "Rajiv Gandhi International Airport", cityName: "Hyderabad", countryName: "India", lat: 17.2403, lon: 78.4294 },
  { iataCode: "MAA", aliases: ["Madras"], name: "Chennai International Airport", cityName: "Chennai", countryName: "India", lat: 12.99, lon: 80.1693 },
  { iataCode: "CCU", aliases: ["Calcutta"], name: "Netaji Subhas Chandra Bose International Airport", cityName: "Kolkata", countryName: "India", lat: 22.6547, lon: 88.4467 },
  { iataCode: "AMD", name: "Sardar Vallabhbhai Patel International Airport", cityName: "Ahmedabad", countryName: "India", lat: 23.0772, lon: 72.6347 },
  { iataCode: "PNQ", name: "Pune Airport", cityName: "Pune", countryName: "India", lat: 18.5821, lon: 73.9197 },
  { iataCode: "GOI", aliases: ["Panaji"], name: "Dabolim Airport", cityName: "Goa", countryName: "India", lat: 15.3808, lon: 73.8314 },
  { iataCode: "COK", aliases: ["Cochin"], name: "Cochin International Airport", cityName: "Kochi", countryName: "India", lat: 10.152, lon: 76.4019 },
  { iataCode: "JAI", name: "Jaipur International Airport", cityName: "Jaipur", countryName: "India", lat: 26.8242, lon: 75.8122 },
  { iataCode: "LKO", name: "Chaudhary Charan Singh International Airport", cityName: "Lucknow", countryName: "India", lat: 26.7606, lon: 80.8893 },
  { iataCode: "KTU", name: "Kota Airport", cityName: "Kota", countryName: "India", lat: 25.1602, lon: 75.8456 },
  { iataCode: "IXC", name: "Chandigarh International Airport", cityName: "Chandigarh", countryName: "India", lat: 30.6735, lon: 76.7885 },
  { iataCode: "TRV", aliases: ["Trivandrum"], name: "Trivandrum International Airport", cityName: "Thiruvananthapuram", countryName: "India", lat: 8.4821, lon: 76.9201 },
  { iataCode: "GAU", name: "Lokpriya Gopinath Bordoloi International Airport", cityName: "Guwahati", countryName: "India", lat: 26.1061, lon: 91.5859 },
  // International
  { iataCode: "DXB", name: "Dubai International Airport", cityName: "Dubai", countryName: "United Arab Emirates", lat: 25.2532, lon: 55.3657 },
  { iataCode: "DOH", name: "Hamad International Airport", cityName: "Doha", countryName: "Qatar", lat: 25.2731, lon: 51.6081 },
  { iataCode: "SIN", name: "Singapore Changi Airport", cityName: "Singapore", countryName: "Singapore", lat: 1.3644, lon: 103.9915 },
  { iataCode: "BKK", name: "Suvarnabhumi Airport", cityName: "Bangkok", countryName: "Thailand", lat: 13.69, lon: 100.7501 },
  { iataCode: "KUL", name: "Kuala Lumpur International Airport", cityName: "Kuala Lumpur", countryName: "Malaysia", lat: 2.7456, lon: 101.7099 },
  { iataCode: "HKG", name: "Hong Kong International Airport", cityName: "Hong Kong", countryName: "Hong Kong", lat: 22.308, lon: 113.9185 },
  { iataCode: "NRT", aliases: ["Narita"], name: "Narita International Airport", cityName: "Tokyo", countryName: "Japan", lat: 35.772, lon: 140.3929 },
  { iataCode: "LHR", name: "Heathrow Airport", cityName: "London", countryName: "United Kingdom", lat: 51.47, lon: -0.4543 },
  { iataCode: "CDG", name: "Charles de Gaulle Airport", cityName: "Paris", countryName: "France", lat: 49.0097, lon: 2.5479 },
  { iataCode: "FRA", name: "Frankfurt Airport", cityName: "Frankfurt", countryName: "Germany", lat: 50.0379, lon: 8.5622 },
  { iataCode: "AMS", name: "Amsterdam Airport Schiphol", cityName: "Amsterdam", countryName: "Netherlands", lat: 52.3105, lon: 4.7683 },
  { iataCode: "JFK", name: "John F. Kennedy International Airport", cityName: "New York", countryName: "United States", lat: 40.6413, lon: -73.7781 },
  { iataCode: "LAX", name: "Los Angeles International Airport", cityName: "Los Angeles", countryName: "United States", lat: 33.9416, lon: -118.4085 },
  { iataCode: "SFO", name: "San Francisco International Airport", cityName: "San Francisco", countryName: "United States", lat: 37.6213, lon: -122.379 },
  { iataCode: "SYD", name: "Sydney Kingsford Smith Airport", cityName: "Sydney", countryName: "Australia", lat: -33.9399, lon: 151.1753 },
  { iataCode: "YYZ", name: "Toronto Pearson International Airport", cityName: "Toronto", countryName: "Canada", lat: 43.6777, lon: -79.6248 },
];

export function findAirport(code) {
  const c = String(code || "").toUpperCase().trim();
  return AIRPORTS.find((a) => a.iataCode === c) || null;
}

export function searchAirports(keyword, limit = 10) {
  const k = String(keyword || "").toLowerCase().trim();
  if (k.length < 2) return [];
  const startsWord = (text) =>
    text.toLowerCase().split(/[\s,-]+/).some((w) => w.startsWith(k));
  const score = (a) => {
    const code = a.iataCode.toLowerCase();
    if (code === k) return 0;
    if (a.cityName.toLowerCase().startsWith(k)) return 1;
    if ((a.aliases || []).some((x) => x.toLowerCase().startsWith(k))) return 1;
    if (code.startsWith(k)) return 2;
    if (startsWord(a.cityName)) return 3;
    if (startsWord(a.name)) return 4;
    if (startsWord(a.countryName)) return 5;
    return 99;
  };
  return AIRPORTS.map((a) => ({ a, s: score(a) }))
    .filter((x) => x.s < 99)
    .sort((x, y) => x.s - y.s)
    .slice(0, limit)
    .map(({ a }) => ({
      type: "location",
      subType: "AIRPORT",
      name: a.name,
      iataCode: a.iataCode,
      address: { cityName: a.cityName, countryName: a.countryName },
    }));
}
