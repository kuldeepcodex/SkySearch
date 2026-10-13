"use client";

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Slider,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useFiltersStore } from "@/src/store/filters.store";
import { useMemo } from "react";
import { formatRupees } from "@/src/domain/flight";


export default function FiltersSidebar({ open, onClose, flights, isLoading = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    priceRange,
    selectedStops,
    selectedAirlines,
    setPriceRange,
    toggleStop,
    toggleAirline,
    resetFilters,
  } = useFiltersStore();

  const { minPrice, maxPrice, stopOptions, airlineOptions } = useMemo(() => {
    if (!flights?.length) {
      return {
        minPrice: 0,
        maxPrice: 1000,
        stopOptions: [0, 1, 2],
        airlineOptions: [],
      };
    }
    const prices = flights.map((f) => f.price?.amount ?? 0).filter(Boolean);
    const minP = prices.length ? Math.min(...prices) : 0;
    const maxP = prices.length ? Math.max(...prices) : 1000;
    const stops = [...new Set(flights.map((f) => f.stops ?? 0))].sort((a, b) => a - b);
    const airlines = [...new Set(flights.map((f) => f.airline?.code).filter(Boolean))];
    const nameByCode = {};
    flights.forEach((f) => {
      if (f.airline?.code) nameByCode[f.airline.code] = f.airline.name ?? f.airline.code;
    });
    return {
      minPrice: minP,
      maxPrice: maxP,
      stopOptions: stops,
      airlineOptions: airlines.map((code) => ({ code, name: nameByCode[code] ?? code })),
    };
  }, [flights]);

  const noFlightsAvailable = !isLoading && (!flights || flights.length === 0);

  const isDefault =
    priceRange[0] === minPrice &&
    priceRange[1] === maxPrice &&
    selectedStops.length === 0 &&
    selectedAirlines.length === 0;

  const handleReset = () => {
    resetFilters([minPrice, maxPrice]);
  };

  const content = (
    <Box sx={{ p: 2, width: isMobile ? "100%" : 280 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Filters
        </Typography>
        {!isMobile && (
          <IconButton onClick={onClose} size="small" aria-label="Close filters">
            <Close />
          </IconButton>
        )}
      </Box>

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
            py: 4,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Price range
      </Typography>
      <Slider
        value={priceRange}
        onChange={(_, value) =>
          setPriceRange(Array.isArray(value) ? value : [value, value])
        }
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => formatRupees(v)}
        min={minPrice}
        max={maxPrice}
        disabled={noFlightsAvailable}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="body2">Min: {formatRupees(priceRange[0])}</Typography>
        <Typography variant="body2">Max: {formatRupees(priceRange[1])}</Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Stops
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
        {stopOptions.map((stop) => (
          <FormControlLabel
            key={stop}
            control={
              <Checkbox
                checked={selectedStops.includes(stop)}
                onChange={() => toggleStop(stop)}
                size="small"
                disabled={noFlightsAvailable}
              />
            }
            label={stop === 0 ? "Non-stop" : stop === 1 ? "1 stop" : `${stop} stops`}
          />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Airlines
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 3 }}>
        {airlineOptions.map(({ code, name }) => (
          <FormControlLabel
            key={code}
            control={
              <Checkbox
                checked={selectedAirlines.includes(code)}
                onChange={() => toggleAirline(code)}
                size="small"
                disabled={noFlightsAvailable}
              />
            }
            label={`${name} (${code})`}
          />
        ))}
      </Box>

      <Button
        variant="outlined"
        fullWidth
        onClick={handleReset}
        disabled={isDefault || noFlightsAvailable}
      >
        Clear Filters
      </Button>
        </>
      )}
    </Box>
  );

  const isDark = theme.palette.mode === "dark";

  return (
    <Drawer
      anchor={isMobile ? "bottom" : "left"}
      open={open}
      onClose={onClose}
      variant={isMobile ? "temporary" : "persistent"}
      sx={{
        "& .MuiDrawer-paper": {
          width: isMobile ? "100%" : 280,
          maxHeight: isMobile ? "80vh" : "100%",
          borderTopLeftRadius: isMobile ? 16 : 0,
          borderTopRightRadius: isMobile ? 16 : 0,
          ...(isMobile && {
            backgroundColor: isDark
              ? "rgba(30, 30, 30, 0.88)"
              : "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid",
            borderBottom: "none",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            boxShadow: isDark
              ? "0 -8px 32px rgba(0,0,0,0.4)"
              : "0 -8px 32px rgba(0,0,0,0.12)",
          }),
        },
      }}
    >
      {content}
    </Drawer>
  );
}
