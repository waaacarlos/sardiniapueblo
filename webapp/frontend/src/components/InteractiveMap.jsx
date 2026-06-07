import { useState, useCallback, useEffect, useRef } from "react";
import { API_URI } from "../api";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  CardHeader,
  CardMedia,
  CardActionArea,
  Skeleton,
  LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";

import sardiniaSvg from "../../assets/sardinia.svg?react";
import caSvg from "../../assets/ca.svg?react";
import ciSvg from "../../assets/ci.svg?react";
import nuSvg from "../../assets/nu.svg?react";
import ogSvg from "../../assets/og.svg?react";
import orSvg from "../../assets/or.svg?react";
import otSvg from "../../assets/ot.svg?react";
import ssSvg from "../../assets/ss.svg?react";
import vsSvg from "../../assets/vs.svg?react";
import PlayerProgressCard from "./PlayerProgressCard";

async function getWikiThumbnail(wikiUrl, size = 300) {
  const title = decodeURIComponent(wikiUrl.split("/wiki/")[1]);
  const lang = new URL(wikiUrl).hostname.split(".")[0]; // "it", "en", ecc.
  const api = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=${size}&origin=*`;

  const res = await fetch(api);
  const data = await res.json();
  const pages = data.query.pages;
  const page = Object.values(pages)[0];
  return page?.thumbnail?.source ?? null;
}

function bull(char) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        mx: "1px",
        transform: "scale(1)",
        backgroundColor: char === "*" ? "primary.dark" : "transparent",
      }}
      className="bullet"
    ></Box>
  );
}

const PROVINCE_MAP = {
  OT: { svgId: "Olbia-Tempio", Svg: otSvg, label: "Gallura Nord-Est Sardegna" },
  SS: { svgId: "Sassari", Svg: ssSvg, label: "Sassari" },
  NU: { svgId: "Nuoro", Svg: nuSvg, label: "Nuoro" },
  OR: { svgId: "Oristano", Svg: orSvg, label: "Oristano" },
  OG: { svgId: "Ogliastra", Svg: ogSvg, label: "Ogliastra" },
  CA: { svgId: "Cagliari", Svg: caSvg, label: "Cagliari" },
  CI: { svgId: "Carbonia-Iglesias", Svg: ciSvg, label: "Sulcis Iglesiente" },
  VS: { svgId: "Medio_Campidano", Svg: vsSvg, label: "Medio Campidano" },
};

const SVG_ID_TO_CODE = Object.fromEntries(
  Object.entries(PROVINCE_MAP).map(([code, { svgId }]) => [svgId, code]),
);

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const value = parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixHex(colorA, colorB, t) {
  const p = Math.max(0, Math.min(1, t));
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const r = Math.round(a.r + (b.r - a.r) * p);
  const g = Math.round(a.g + (b.g - a.g) * p);
  const bCh = Math.round(a.b + (b.b - a.b) * p);
  return "#" + [r, g, bCh].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function buildSardiniaCss(mapColors, percentagesByCode) {
  let css = "";

  for (const [code, province] of Object.entries(PROVINCE_MAP)) {
    const pct = percentagesByCode[code] ?? 0;
    const t = pct / 100;

    const fill = mixHex(mapColors.base, mapColors.found, t);
    const hover = mixHex(mapColors.baseHover, mapColors.foundHover, t);

    const escaped = CSS.escape(province.svgId);
    css +=
      ".interactive-map-root g#" +
      escaped +
      " path { fill: " +
      fill +
      " !important; cursor: pointer; }\n";
    css +=
      ".interactive-map-root g#" +
      escaped +
      ":hover path { fill: " +
      hover +
      " !important; }\n";
  }

  return css;
}

function buildProvinceCss(foundNames, selectedCityId, mapColors) {
  const foundSet = new Set(
    foundNames.map((n) =>
      n
        .toUpperCase()
        .replace(/ /g, "_")
        .replace(/-/g, "_")
        .replace(/'/g, "_")
        .replace("Ì", "I_")
        .replace("È", "E_")
        .replace("À", "A_")
        .replace("Ù", "U_")
        .replace("Ò", "O_"),
    ),
  );
  let css = `
    .interactive-map-root g[id] path { fill: ${mapColors.neutral} !important; }
    .interactive-map-root g[id]:hover path { fill: ${mapColors.neutralHover} !important; cursor: pointer; }
  `;

  const escapedSelected = selectedCityId ? CSS.escape(selectedCityId) : null;
  if (escapedSelected) {
    css += `.interactive-map-root g#${escapedSelected} path { fill: ${mapColors.selected} !important; stroke: ${mapColors.selectedStroke} !important; stroke-width: 1.5px !important; }\n`;
    css += `.interactive-map-root g#${escapedSelected}:hover path { fill: ${mapColors.selectedHover} !important; }\n`;
  }

  for (const name of foundSet) {
    const escaped = CSS.escape(name);
    css += `.interactive-map-root g#${escaped} path { fill: ${mapColors.found} !important; }\n`;
    css += `.interactive-map-root g#${escaped}:hover path { fill: ${mapColors.foundHover} !important; cursor: pointer; }\n`;
  }
  return css;
}

function normalizeCityId(name) {
  return name
    .toUpperCase()
    .replace(/ /g, "_")
    .replace(/-/g, "_")
    .replace(/'/g, "_")
    .replace("Ì", "I_")
    .replace("È", "E_")
    .replace("À", "A_")
    .replace("Ù", "U_")
    .replace("Ò", "O_");
}

export default function InteractiveMap({ citiesFound, allCities }) {
  const theme = useTheme();
  const mapColors = theme.palette.app?.map;
  const mapRootRef = useRef(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [cityCard, setCityCard] = useState(null);
  const [tooltip, setTooltip] = useState({ name: null, x: 0, y: 0 });
  const [loadingCard, setLoadingCard] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const [provinceOverlays, setProvinceOverlays] = useState([]);

  const foundCount = selectedProvince
    ? citiesFound.filter((c) => c.provincia === selectedProvince).length
    : 0;

  const foundInProvince = selectedProvince
    ? citiesFound.map((c) => c.nome)
    : [];

  const percentagesByCode = Object.fromEntries(
    Object.keys(PROVINCE_MAP).map((code) => {
      const total = allCities.filter((c) => c.provincia === code).length;
      const found = citiesFound.filter((c) => c.provincia === code).length;
      const pct = total > 0 ? Math.round((found / total) * 100) : 0;
      return [code, pct];
    }),
  );

  const MapSvg = selectedProvince
    ? PROVINCE_MAP[selectedProvince].Svg
    : sardiniaSvg;
  const mapCss = selectedProvince
    ? buildProvinceCss(foundInProvince, selectedCityId, mapColors)
    : buildSardiniaCss(mapColors, percentagesByCode);

  useEffect(() => {
    const root = mapRootRef.current;
    if (!root) return;

    let frameId = 0;
    let observer = null;

    const syncMapLayout = () => {
      const svgEl = root.querySelector("svg");
      if (!svgEl) return;

      const hasViewBox = svgEl.hasAttribute("viewBox");
      const widthAttr = svgEl.getAttribute("width");
      const heightAttr = svgEl.getAttribute("height");
      const width = widthAttr ? parseFloat(widthAttr) : NaN;
      const height = heightAttr ? parseFloat(heightAttr) : NaN;

      if (!hasViewBox && Number.isFinite(width) && Number.isFinite(height)) {
        svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }

      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");

      if (selectedProvince) {
        setProvinceOverlays([]);
        return;
      }

      const rootRect = root.getBoundingClientRect();

      const next = Object.entries(PROVINCE_MAP)
        .map(([code, province]) => {
          const group = svgEl.querySelector(`g#${CSS.escape(province.svgId)}`);
          if (!group) return null;

          const rect = group.getBoundingClientRect();

          return {
            code,
            label: province.label,
            left: rect.left - rootRect.left + rect.width / 2,
            top: rect.top - rootRect.top + rect.height / 2,
            count: allCities.filter((c) => c.provincia === code).length,
            foundCount: citiesFound.filter((c) => c.provincia === code).length,
            percentage: Math.round(
              (citiesFound.filter((c) => c.provincia === code).length /
                allCities.filter((c) => c.provincia === code).length) *
                100,
            ),
          };
        })
        .filter(Boolean);

      setProvinceOverlays(next);
    };

    const scheduleSync = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(syncMapLayout);
    };

    scheduleSync();

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleSync);
      observer.observe(root);
    }

    window.addEventListener("resize", scheduleSync);

    return () => {
      cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", scheduleSync);
    };
  }, [selectedProvince]);

  const handleMouseMove = useCallback((e) => {
    const group = e.target.closest("g[id]");
    const normalizedId = group?.id.toUpperCase();
    const found = citiesFound.find(
      (c) => normalizeCityId(c.nome) === normalizedId,
    );

    if (group) {
      setTooltip({
        name: group.id.replace(/_/g, " "),
        found: Boolean(found),
        x: e.clientX,
        y: e.clientY,
      });
    } else {
      setTooltip((t) => ({ ...t, name: null }));
    }
  }, []);

  const handleClick = useCallback(
    (e) => {
      const group = e.target.closest("g[id]");
      if (selectedProvince) {
        if (!group) {
          setCityCard(null);
          return;
        }
        const normalizedId = group.id.toUpperCase();
        setSelectedCityId(normalizedId);
        const found = citiesFound.find(
          (c) => normalizeCityId(c.nome) === normalizedId,
        );
        const displayName = group.id
          .replace(/_/g, " ")
          .replaceAll(/[a-zA-Z]/g, "*");
        setCityCard(null);
        setLoadingCard(true);
        setImageReady(false);
        fetch(
          API_URI +
            "/api/city?city_id=" +
            encodeURIComponent(normalizedId)
              .replaceAll(/__/g, " ")
              .replace(/_/g, " "),
        )
          .then((response) => response.json())
          .then(async (city) => {
            setCityCard({
              real_name: city.nome,
              name: found ? found.nome : displayName,
              found: Boolean(found),
              name_original: found ? found.nome_originale : "",
              territorio: city.territorio,
              thumbnail: null,
              popolazione:
                Number(city.popolazione).toLocaleString("it-IT") + " abitanti",
              estensione:
                Math.round(city.superficie).toLocaleString("it-IT") + " km²",
              altitudine: city.altitudine.toLocaleString("it-IT") + " m",
              url: city.url,
              x: e.clientX,
              y: e.clientY,
            });
            setLoadingCard(false);

            const thumbnail = await getWikiThumbnail(city.url);
            setCityCard((prev) => (prev ? { ...prev, thumbnail } : prev));
          });
        return;
      }
      if (!group) return;
      const code = SVG_ID_TO_CODE[group.id];
      if (code) setSelectedProvince(code);
    },
    [selectedProvince, citiesFound],
  );
  return (
    <>
      {tooltip.name && tooltip.found && (
        <Box
          sx={{
            position: "fixed",
            top: tooltip.y + 12,
            left: tooltip.x + 12,
            bgcolor: "rgba(0,0,0,0.75)",
            color: "#fff",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: "0.75rem",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          {tooltip.name}
        </Box>
      )}
      <Box sx={{ width: "100%" }}>
        {selectedProvince && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <IconButton
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedProvince(null);
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="subtitle1">
              {PROVINCE_MAP[selectedProvince].label} — comuni trovati:{" "}
              {foundCount}
            </Typography>
          </Box>
        )}
        {loadingCard && (
          <Card
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9998,
              boxShadow: 4,
              overflow: "hidden",
              animation: "slideUp 0.3s ease",
              "@keyframes slideUp": {
                from: { transform: "translateY(100%)" },
                to: { transform: "translateY(0)" },
              },
            }}
          >
            <CardContent>
              <Skeleton width="60%" height={24} />
              <Skeleton width="40%" height={20} sx={{ mt: 0.5 }} />
              <Skeleton width="80%" height={20} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        )}
        {cityCard && (
          <Card
            sx={{
              position: "fixed",
              display: "flex",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9998,
              boxShadow: 4,
              pointerEvents: "auto",
              overflow: "visible",
              transition: "transform 0.3s ease",
            }}
          >
            <IconButton
              onClick={() => setCityCard(null)}
              size="small"
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 1,
                bgcolor: "background.paper",
                boxShadow: 2,
                color: "text.secondary",
                "&:hover": { bgcolor: "error.light", color: "#fff" },
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>

            <Box
              sx={{
                width: imageReady ? 150 : 0,
                display: "flex",
                flexDirection: "column",
                transition: "width 0.3s ease",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <Box sx={{ width: 150, height: 150, position: "relative" }}>
                {cityCard.thumbnail && (
                  <>
                    {!imageReady && (
                      <Skeleton
                        variant="rectangular"
                        width={150}
                        height={150}
                        sx={{ position: "absolute", inset: 0 }}
                      />
                    )}
                    <CardActionArea
                      href={cityCard.found ? cityCard.url : null}
                      rel="noopener noreferrer"
                      target="_blank"
                      sx={{ flex: "1 0 auto" }}
                    >
                      <CardMedia
                        component="img"
                        image={cityCard.thumbnail}
                        onLoad={() => setImageReady(true)}
                        sx={{
                          objectFit: "cover",
                          height: 150,
                          opacity: imageReady ? 1 : 0,
                          transition: "opacity 320ms ease",
                        }}
                      />
                    </CardActionArea>
                  </>
                )}
              </Box>
            </Box>

            <CardContent sx={{ pb: "12px !important", p: 2 }}>
              <Box sx={{ alignItems: "flex-start", gap: 1 }}>
                <Box>
                  <Box sx={{ alignItems: "center" }}>
                    <Box
                      sx={{
                        color: "primary.secondary",
                        fontSize: "1.1rem",
                      }}
                    >
                      {Array.from(cityCard.name).map((char, index) => (
                        <span key={index}>
                          {cityCard.found ? char : bull(char)}
                        </span>
                      ))}
                    </Box>
                    <Box
                      sx={{
                        fontStyle: "italic",
                        color: "primary.main",
                      }}
                    >
                      {cityCard.name_original}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={cityCard.territorio.toUpperCase()}
                    size="extraSmall"
                    color="secondary"
                    variant="outlined"
                    sx={{ mb: 0.5 }}
                  ></Chip>
                </Box>

                <Box sx={{ mt: 1 }}>
                  {cityCard.popolazione} — {cityCard.estensione} —{" "}
                  {cityCard.altitudine}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
        <div className="map_background">
          <Box sx={{ position: "relative", width: "100%" }}>
            <Box
              key={selectedProvince ?? "sardinia"} // Forza re-render quando cambia la provincia per aggiornare lo stile
              ref={mapRootRef}
              onClick={handleClick}
              onMouseMove={handleMouseMove}
              className="interactive-map-root"
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                maxWidth: "100%",
                animation: "fadeIn 0.35s ease",
                "@keyframes fadeIn": {
                  from: { opacity: 0, transform: "scale(0.97)" },
                  to: { opacity: 1, transform: "scale(1)" },
                },
                "& svg": {
                  width: "100%",
                  height: "auto",
                  display: "block",
                  maxHeight: "calc(100vh - 180px)",
                  maxWidth: "100%",
                  marginInline: "auto",
                },
              }}
            >
              <style>{mapCss}</style>
              <MapSvg />
            </Box>
            {!selectedProvince &&
              provinceOverlays.map((province) => (
                <Box
                  key={province.code}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedProvince(province.code);
                  }}
                  sx={{
                    position: "absolute",
                    left: province.left,
                    top: province.top,
                    transform: "translate(-50%, -50%)",
                    px: 1.5,
                    py: 1,
                    zIndex: 2,
                    cursor: "pointer",
                    textShadow: "0 0 40px black, 0 0 60px black",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    borderRadius: 1,
                    color: "#fff",
                    fontSize: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  <Box>
                    <Typography variant="h6" align="center">
                      {province.label}
                    </Typography>
                    <Typography
                      variant="h6"
                      align="center"
                      sx={{
                        lineHeight: 1,
                        color: "text.secondary",
                        fontSize: "0.65rem",
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Box sx={{ width: "100%", mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={province.percentage}
                          />
                        </Box>
                        <Box>{province.percentage}%</Box>
                      </Box>
                    </Typography>
                  </Box>
                </Box>
              ))}
          </Box>
        </div>
      </Box>
    </>
  );
}
