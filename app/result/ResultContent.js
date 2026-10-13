"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { Box, Container, Typography, Alert, CircularProgress, Fab } from "@mui/material";
import CompareIcon from "@mui/icons-material/Compare";
import { useMediaQuery, useTheme } from "@mui/material";
import { format } from "date-fns";
import { useFlights } from "@/src/hooks/useFlights";
import { useFiltersStore } from "@/src/store/filters.store";
import { useCompareStore } from "@/src/store/compare.store";
import { calculateBestScore } from "@/src/domain/flight";
import useSearchStore from "@/src/store/search.store";
import ResultHeaderForm from "@/src/components/ResultHeaderForm";
import FiltersSidebar from "@/src/components/FiltersSidebar";
import SortingTabs from "@/src/components/SortingTabs";
import PriceGraph from "@/src/components/PriceGraph";
import FlightCard from "@/src/components/FlightCard";
import CompareDrawer from "@/src/components/CompareDrawer";

function useSyncSearchParams() {
  const searchParams = useSearchParams();
  const setStore = useSearchStore.getState();

  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dateStr = searchParams.get("date");
    if (!from || !to || !dateStr) return;

    const returnDateStr = searchParams.get("returnDate");
    const tripType = searchParams.get("tripType") || "round-trip";
    const adults = parseInt(searchParams.get("adults") || "1", 10);
    const children = parseInt(searchParams.get("children") || "0", 10);
    const infantsInSeat = parseInt(searchParams.get("infantsInSeat") || "0", 10);
    const infantsOnLap = parseInt(searchParams.get("infantsOnLap") || "0", 10);
    const cabinClass = searchParams.get("cabinClass") || "ECONOMY";

    setStore.setOrigin(from);
    setStore.setDestination(to);
    setStore.setTripType(tripType);
    setStore.setAdults(adults);
    setStore.setChildren(children);
    setStore.setInfantsInSeat(infantsInSeat);
    setStore.setInfantsOnLap(infantsOnLap);
    setStore.setCabinClass(cabinClass);
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) setStore.setDepartureDate(d);
    if (returnDateStr) {
      const rd = new Date(returnDateStr);
      if (!isNaN(rd.getTime())) setStore.setReturnDate(rd);
    } else {
      setStore.setReturnDate(null);
    }
  }, [searchParams]);
}

function getParamsFromSearchParams(searchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");
  if (!from || !to || !date) return null;
  return {
    from,
    to,
    date,
    returnDate: searchParams.get("returnDate") || undefined,
    adults: parseInt(searchParams.get("adults") || "1", 10),
    children: parseInt(searchParams.get("children") || "0", 10),
    infantsInSeat: parseInt(searchParams.get("infantsInSeat") || "0", 10),
    infantsOnLap: parseInt(searchParams.get("infantsOnLap") || "0", 10),
    cabinClass: searchParams.get("cabinClass") || "ECONOMY",
  };
}

function getParamsFromStore() {
  const state = useSearchStore.getState();
  const { origin, destination, departureDate, returnDate, adults, children, infantsInSeat, infantsOnLap, cabinClass, tripType } = state;
  if (!origin || !destination || !departureDate) return null;
  const d = departureDate instanceof Date ? departureDate : new Date(departureDate);
  if (isNaN(d.getTime())) return null;
  const dateStr = format(d, "yyyy-MM-dd");
  let returnDateStr;
  if (returnDate) {
    const rd = returnDate instanceof Date ? returnDate : new Date(returnDate);
    returnDateStr = !isNaN(rd.getTime()) ? format(rd, "yyyy-MM-dd") : undefined;
  }
  return {
    from: String(origin).trim(),
    to: String(destination).trim(),
    date: dateStr,
    returnDate: tripType === "round-trip" && returnDateStr ? returnDateStr : undefined,
    adults: adults ?? 1,
    children: children ?? 0,
    infantsInSeat: infantsInSeat ?? 0,
    infantsOnLap: infantsOnLap ?? 0,
    cabinClass: cabinClass || "ECONOMY",
  };
}

export default function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [compareOpen, setCompareOpen] = useState(false);

  const { selectedFlights } = useCompareStore();

  useSyncSearchParams();

  const paramsFromUrl = getParamsFromSearchParams(searchParams);
  const paramsFromStore = getParamsFromStore();
  const params = paramsFromUrl ?? paramsFromStore;

  const hasReplacedUrl = useRef(false);
  useEffect(() => {
    if (paramsFromUrl) {
      hasReplacedUrl.current = false;
      return;
    }
    if (!paramsFromStore || hasReplacedUrl.current) return;
    hasReplacedUrl.current = true;
    const q = new URLSearchParams({
      from: paramsFromStore.from,
      to: paramsFromStore.to,
      date: paramsFromStore.date,
      tripType: useSearchStore.getState().tripType,
      adults: String(paramsFromStore.adults),
      children: String(paramsFromStore.children),
      infantsInSeat: String(paramsFromStore.infantsInSeat),
      infantsOnLap: String(paramsFromStore.infantsOnLap),
      cabinClass: paramsFromStore.cabinClass,
    });
    if (paramsFromStore.returnDate) q.set("returnDate", paramsFromStore.returnDate);
    router.replace(`/result?${q.toString()}`, { scroll: false });
  }, [paramsFromUrl?.from, paramsFromUrl?.to, paramsFromUrl?.date, paramsFromStore?.from, paramsFromStore?.to, paramsFromStore?.date, router]);

  const { data: flights, isLoading, error } = useFlights(params);

  const {
    priceRange,
    setPriceRange,
    selectedStops,
    selectedAirlines,
    sortPreset,
    resetFilters,
  } = useFiltersStore();

  const searchKey = params ? `${params.from}-${params.to}-${params.date}` : null;
  const prevSearchKeyRef = useRef(null);
  useEffect(() => {
    if (!searchKey) return;

    if (searchKey !== prevSearchKeyRef.current) {
      resetFilters();
      useCompareStore.getState().clearSelection();
    }
    prevSearchKeyRef.current = searchKey;
  }, [searchKey, resetFilters]);

  useEffect(() => {
    if (!flights?.length) return;
    const prices = flights.map((f) => f.price?.amount ?? 0).filter(Boolean);
    if (prices.length === 0) return;
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const [low, high] = priceRange;
    if (low === 0 && high === 1000000) {
      setPriceRange([minP, maxP]);
    }
  }, [flights, priceRange, setPriceRange]);

  const filteredAndSortedFlights = useMemo(() => {
    if (!flights?.length) return [];
    let list = flights.filter((f) => {
      const amount = f.price?.amount ?? 0;
      const [minP, maxP] = priceRange;
      if (amount < minP || amount > maxP) return false;
      if (selectedStops.length > 0 && !selectedStops.includes(f.stops ?? 0))
        return false;
      if (
        selectedAirlines.length > 0 &&
        !selectedAirlines.includes(f.airline?.code ?? "")
      )
        return false;
      return true;
    });

    const prices = list.map((f) => f.price?.amount ?? 0).filter(Boolean);
    const durations = list.map((f) => f.durationMinutes ?? 0).filter(Boolean);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const minDuration = durations.length ? Math.min(...durations) : 0;
    const maxDuration = durations.length ? Math.max(...durations) : 0;

    if (sortPreset === "cheapest") {
      list = [...list].sort((a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0));
    } else if (sortPreset === "fastest") {
      list = [...list].sort(
        (a, b) => (a.durationMinutes ?? 0) - (b.durationMinutes ?? 0)
      );
    } else {
      list = [...list].sort((a, b) => {
        const scoreA = calculateBestScore(
          a,
          minPrice,
          maxPrice,
          minDuration,
          maxDuration
        );
        const scoreB = calculateBestScore(
          b,
          minPrice,
          maxPrice,
          minDuration,
          maxDuration
        );
        return scoreB - scoreA;
      });
    }
    return list;
  }, [
    flights,
    priceRange,
    selectedStops,
    selectedAirlines,
    sortPreset,
  ]);

  const mainMarginLeft =
    filtersOpen && !isMobile ? "280px" : 0;
  const transition = "margin-left 0.2s ease";

  if (!params) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Missing search parameters. Please enter origin, destination, and date.
        </Alert>
        <Typography
          component="a"
          href="/#search-section"
          sx={{ color: "primary.main", textDecoration: "underline" }}
        >
          New Search
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ ml: mainMarginLeft, transition }}>
        <ResultHeaderForm
          onToggleSidebar={() => setFiltersOpen((o) => !o)}
          sidebarOpen={filtersOpen}
          onOpenCompare={() => setCompareOpen(true)}
          compareCount={selectedFlights.length}
        />
      </Box>

      <FiltersSidebar
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        flights={flights ?? []}
        isLoading={isLoading}
      />

      <Box sx={{ ml: mainMarginLeft, transition }}>
        <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          {isLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 300,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load flights. Please try again.
            </Alert>
          )}

          {!isLoading && !error && flights && (
            <>
              <SortingTabs />
              <PriceGraph flights={filteredAndSortedFlights} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {filteredAndSortedFlights.length} flight
                {filteredAndSortedFlights.length !== 1 ? "s" : ""} found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sorted by {sortPreset === "best" ? "Best (price + duration)" : sortPreset}
              </Typography>

              {filteredAndSortedFlights.length === 0 ? (
                <Alert severity="info">
                  {flights.length === 0
                    ? "No flights available for this search."
                    : "No flights match your filters. Try adjusting price range, stops, or airlines."}
                </Alert>
              ) : (
                <Box>
                  {filteredAndSortedFlights.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      allFlights={flights}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>

      <CompareDrawer
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        allFlights={flights ?? []}
      />

      {selectedFlights.length === 2 && (
        <Fab
          color="primary"
          variant="extended"
          onClick={() => setCompareOpen(true)}
          sx={{
            position: "fixed",
            right: 24,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: (theme) => theme.zIndex.speedDial,
          }}
          aria-label="Compare selected flights"
        >
          <CompareIcon sx={{ mr: 1 }} />
          Compare Flights
        </Fab>
      )}
    </Box>
  );
}
