import { useState, useCallback } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";

import sardiniaSvg from "../../assets/sardinia.svg?raw";
import caSvg from "../../assets/ca.svg?raw";
import ciSvg from "../../assets/ci.svg?raw";
import nuSvg from "../../assets/nu.svg?raw";
import ogSvg from "../../assets/og.svg?raw";
import orSvg from "../../assets/or.svg?raw";
import otSvg from "../../assets/ot.svg?raw";
import ssSvg from "../../assets/ss.svg?raw";
import vsSvg from "../../assets/vs.svg?raw";

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
  OT: { svgId: "Olbia-Tempio", svg: otSvg, label: "Gallura Nord-Est Sardegna" },
  SS: { svgId: "Sassari", svg: ssSvg, label: "Sassari" },
  NU: { svgId: "Nuoro", svg: nuSvg, label: "Nuoro" },
  OR: { svgId: "Oristano", svg: orSvg, label: "Oristano" },
  OG: { svgId: "Ogliastra", svg: ogSvg, label: "Ogliastra" },
  CA: { svgId: "Cagliari", svg: caSvg, label: "Cagliari" },
  CI: { svgId: "Carbonia-Iglesias", svg: ciSvg, label: "Sulcis Iglesiente" },
  VS: { svgId: "Medio_Campidano", svg: vsSvg, label: "Medio Campidano" },
};

const SVG_ID_TO_CODE = Object.fromEntries(
  Object.entries(PROVINCE_MAP).map(([code, { svgId }]) => [svgId, code]),
);

function injectStyle(svgText, css) {
  let result = svgText;

  // Inietta viewBox se assente, necessario per il CSS scaling
  if (!result.includes("viewBox")) {
    const w = result.match(/\bwidth="([^"]+)"/)?.[1];
    const h = result.match(/\bheight="([^"]+)"/)?.[1];
    if (w && h) {
      result = result.replace("<svg", `<svg viewBox="0 0 ${w} ${h}"`);
    }
  }

  return result.replace(/<svg([^>]*)>/, `<svg$1><style>${css}</style>`);
}

function buildSardiniaCss(mapColors) {
  return `
    g[id] path { fill: ${mapColors.base} !important; cursor: pointer; }
    g[id]:hover path { fill: ${mapColors.baseHover} !important; }
  `;
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
    g[id] path { fill: ${mapColors.neutral} !important; }
    g[id]:hover path { fill: ${mapColors.neutralHover} !important; cursor: pointer; }
  `;
  for (const name of foundSet) {
    const escaped = CSS.escape(name);
    const escapedSelected = CSS.escape(selectedCityId);
    css += `g#${escapedSelected} path { fill: ${mapColors.selected} !important; stroke: ${mapColors.selectedStroke} !important; stroke-width: 1.5px !important; }\n`;
    css += `g#${escapedSelected}:hover path { fill: ${mapColors.selectedHover} !important; }\n`;
    css += `g#${escaped} path { fill: ${mapColors.found} !important; }\n`;
    css += `g#${escaped}:hover path { fill: ${mapColors.foundHover} !important; cursor: pointer; }\n`;
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

export default function InteractiveMap({ citiesFound }) {
  const theme = useTheme();
  const mapColors = theme.palette.app?.map;
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [cityCard, setCityCard] = useState(null);
  const [tooltip, setTooltip] = useState({ name: null, x: 0, y: 0 });
  const [loadingCard, setLoadingCard] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const foundCount = selectedProvince
    ? citiesFound.filter((c) => c.provincia === selectedProvince).length
    : 0;

  const foundInProvince = selectedProvince
    ? citiesFound.map((c) => c.nome)
    : [];

  const svgContent = selectedProvince
    ? injectStyle(
        PROVINCE_MAP[selectedProvince].svg,
        buildProvinceCss(foundInProvince, selectedCityId, mapColors),
      )
    : injectStyle(sardiniaSvg, buildSardiniaCss(mapColors));

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
          <Box
            key={selectedProvince ?? "sardinia"} // Forza re-render quando cambia la provincia per aggiornare lo stile
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            sx={{
              display: "flex",
              justifyContent: "center",
              animation: "fadeIn 0.35s ease",
              "@keyframes fadeIn": {
                from: { opacity: 0, transform: "scale(0.97)" },
                to: { opacity: 1, transform: "scale(1)" },
              },
              "& svg": {
                width: "auto",
                height: "auto",
                display: "block",
                maxHeight: "calc(100vh - 180px)",
                maxWidth: "100%",
              },
            }}
          ></Box>
        </div>
      </Box>
    </>
  );
}
