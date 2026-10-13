"use client";

import { Paper, Typography, Box, useTheme } from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatPrice, formatRupees, formatTime } from "@/src/domain/flight";

export default function PriceGraph({ flights }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const isDark = theme.palette.mode === "dark";

  const sorted =
    flights
      ?.map((f) => ({
        time: formatTime(f.departure?.timestamp ?? 0),
        price: f.price?.amount ?? 0,
        flightId: f.id,
        airline: f.airline?.name ?? f.airline?.code ?? "—",
      }))
      .sort((a, b) => {
        const fa = flights.find((f) => f.id === a.flightId);
        const fb = flights.find((f) => f.id === b.flightId);
        const ta = fa?.departure?.timestamp ?? 0;
        const tb = fb?.departure?.timestamp ?? 0;
        return ta - tb;
      }) ?? [];

  const data = sorted.map((d, i) => ({ ...d, index: i + 1 }));

  const prices = data.map((d) => d.price).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 500;

  const step = maxPrice <= 2000 ? 500 : maxPrice <= 10000 ? 2000 : maxPrice <= 40000 ? 5000 : 10000;
  const yMin = 0;
  const yMax = Math.max(Math.ceil(maxPrice / step) * step, step);
  const yTickCount = 6;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <Paper
        elevation={0}
        sx={{
          px: 1.5,
          py: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block">
          {d.time}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ color: primary }}>
          {formatPrice({ amount: d.price, currency: "USD" })}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {d.airline}
        </Typography>
      </Paper>
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Price by departure time
        </Typography>
        {data.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Lowest: {formatPrice({ amount: minPrice, currency: "USD" })}
          </Typography>
        )}
      </Box>
      {data.length === 0 ? (
        <Box
          sx={{
            height: 320,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
            gap: 1,
          }}
        >
          <Typography variant="body2">No flights to display</Typography>
          <Typography variant="caption">Adjust filters or search again</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={data}
            margin={{ top: 16, right: 20, left: 8, bottom: 8 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              vertical={false}
            />
            <XAxis
              dataKey="index"
              type="number"
              domain={[0.5, data.length + 0.5]}
              tick={{ fill: "currentColor", fontSize: 11 }}
              stroke={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}
              tickLine={false}
              axisLine={{ stroke: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }}
              allowDecimals={false}
              tickCount={Math.min(Math.max(data.length, 2), 8)}
            />
            <YAxis
              domain={[yMin, yMax]}
              tickCount={yTickCount}
              tickFormatter={(v) => formatRupees(v)}
              tick={{ fill: "currentColor", fontSize: 11 }}
              stroke={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}
              tickLine={false}
              axisLine={false}
              width={72}
              allowDecimals={false}
            />
            <ReferenceLine
              y={minPrice}
              stroke={primary}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: primary, strokeOpacity: 0.3 }} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={primary}
              strokeWidth={2.5}
              fill="url(#priceGradient)"
              dot={{ r: 4, fill: primary, strokeWidth: 2, stroke: "background.paper" }}
              activeDot={{ r: 6, fill: primary, strokeWidth: 2, stroke: "background.paper" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}
