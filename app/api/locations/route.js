import { searchLocations } from "@/src/api/amadeus";
import { searchAirports } from "@/src/data/airports";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim() || "";

  if (keyword.length < 2) {
    return Response.json(
      { error: "keyword must be at least 2 characters" },
      { status: 400 }
    );
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret ||
    clientId.trim() === "" ||
    clientSecret.trim() === ""
  ) {
    // No API keys: use the built-in local airport list instead.
    return Response.json({ data: searchAirports(keyword) });
  }

  try {
    const response = await searchLocations(keyword, clientId, clientSecret);
    return Response.json(response);
  } catch (err) {
    console.error("Amadeus locations error:", err.message);
    return Response.json(
      { error: err.message || "Location search failed", data: [] },
      { status: 500 }
    );
  }
}
