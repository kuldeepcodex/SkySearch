import { fetchAmadeusFlights } from "@/src/api/amadeus";
import { adaptAmadeusResponse } from "@/src/api/adaptFlight";
import { generateMockFlights } from "@/src/data/mockFlights";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDateString(str) {
  if (!str || typeof str !== "string") return false;
  if (!DATE_REGEX.test(str.trim())) return false;
  const d = new Date(str.trim());
  return !isNaN(d.getTime());
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from =
    searchParams.get("from") || searchParams.get("originLocationCode");
  const to =
    searchParams.get("to") ||
    searchParams.get("destinationLocationCode");
  const date =
    searchParams.get("date") || searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate") || undefined;
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const infantsInSeat = parseInt(
    searchParams.get("infantsInSeat") || "0",
    10
  );
  const infantsOnLap = parseInt(searchParams.get("infantsOnLap") || "0", 10);
  const cabinClass =
    searchParams.get("cabinClass") || searchParams.get("travelClass") || undefined;

  if (!from || !to || !date) {
    return Response.json(
      { error: "Missing required params: from, to, date" },
      { status: 400 }
    );
  }

  if (!isValidDateString(date)) {
    return Response.json(
      { error: "Invalid date: use YYYY-MM-DD for departure date" },
      { status: 400 }
    );
  }
  if (returnDate && !isValidDateString(returnDate)) {
    return Response.json(
      { error: "Invalid returnDate: use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const depDate = new Date(date.trim());
  depDate.setHours(0, 0, 0, 0);
  if (depDate < today) {
    return Response.json(
      {
        error:
          "Departure date cannot be in the past. Amadeus requires a today or future date.",
      },
      { status: 400 }
    );
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  const useAmadeus =
    clientId &&
    clientSecret &&
    clientId.trim() !== "" &&
    clientSecret.trim() !== "";

  if (useAmadeus) {
    try {
      const params = {
        originLocationCode: from.toUpperCase().trim(),
        destinationLocationCode: to.toUpperCase().trim(),
        departureDate: date.trim(),
        returnDate: returnDate?.trim() || undefined,
        adults: Math.max(1, adults),
        children: Math.max(0, children),
        infantsInSeat: Math.max(0, infantsInSeat),
        infantsOnLap: Math.max(0, infantsOnLap),
        travelClass: cabinClass?.trim() || undefined,
      };
      const response = await fetchAmadeusFlights(
        params,
        clientId,
        clientSecret
      );
      const flights = adaptAmadeusResponse(response);
      return Response.json({ flights });
    } catch (err) {
      console.error("Amadeus flights error:", err.message);
      return Response.json({ flights: [] });
    }
  }

  // No API keys: generate demo flights locally.
  const flights = generateMockFlights({
    from,
    to,
    date: date.trim(),
    cabinClass: cabinClass?.trim() || "ECONOMY",
    adults: Math.max(1, adults),
  });
  return Response.json({ flights });
}
