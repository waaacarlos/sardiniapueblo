import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Fab,
  Grid,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import EditIcon from "@mui/icons-material/Edit";
import { API_URI } from "../api";
import { useTheme } from "@mui/material/styles";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

function calcProgress(count, total) {
  const maxcount = Math.max(count, total);
  return (count / maxcount) * 100;
}

export default function PlayerAchievement({
  playerId,
  playerData,
  citiesFound,
  cities,
}) {
  const theme = useTheme();
  const shellShadow = theme.customShadows?.raisedInset;
  const softShadow = theme.customShadows?.soft;
  const surfaceColors = theme.palette.app?.surface;
  const rankingColors = theme.palette.app?.ranking;

  const [headerReady, setHeaderReady] = useState(false);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const timeouts = [];

    fetch(`${API_URI}/api/player/achievements?player_id=${playerId}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;

        const achs = [...data].map((ach) => ({ ...ach, visible: false }));

        setAchievements(achs);
        setTimeout(() => setHeaderReady(true), 50);

        achs.forEach((_, index) => {
          const id = setTimeout(
            () => {
              if (cancelled) return;
              setAchievements((prev) =>
                prev.map((item, i) =>
                  i === index ? { ...item, visible: true } : item,
                ),
              );
            },
            (index + 1) * 150,
          );

          timeouts.push(id);
        });
      });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [playerId]);

  const formatProgress = (ach) => {
    switch (ach.category) {
      case "city":
        let cityCount = citiesFound.filter((city) =>
          ach.cities.includes(city.id),
        ).length;
        return calcProgress(cityCount, ach.cities.length).toFixed(0);
      case "province":
        let provinceFoundCount = citiesFound.filter(
          (city) => city.provincia === ach.province,
        ).length;
        let provinceCount = cities.filter(
          (city) => city.provincia === ach.province,
        ).length;
        return calcProgress(provinceFoundCount, provinceCount).toFixed(0);
      case "progress":
        return calcProgress(citiesFound.length, ach.threshold).toFixed(0);
      default:
        return ach.unlocked ? 100 : 0;
    }
  };

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "90vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 3,
            backgroundColor: surfaceColors?.strong,
            boxShadow: softShadow,
          }}
        >
          <Box
            p={2}
            m={2}
            sx={{
              textShadow: "0 0 10px black",
            }}
          >
            <Box
              p={2}
              m={2}
              sx={{
                fontSize: "2rem",
                fontWeight: "bold",
                letterSpacing: headerReady ? "normal" : "0.5em",
                minHeight: headerReady ? "0" : "90vh",
                transition: "all 1s ease",
                alignItems: "center",
                display: "flex",
                gap: 2,
                justifyContent: "center",
              }}
            >
              <h3>Obiettivi sbloccati</h3>
            </Box>
          </Box>
        </Box>
      </Box>
      <Grid container spacing={2} sx={{ mb: 2, alignItems: "center" }}>
        {achievements?.map((ach) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={ach.ach_key}>
            <Card
              key={ach.ach_key}
              sx={{
                backgroundColor: ach.unlocked
                  ? rankingColors?.highlight
                  : surfaceColors?.soft,
                textShadow: "0 0 5px black",
                opacity: ach.visible ? 1 : 0,
                transform: ach.visible ? "scale(1)" : "scale(0.95)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                boxShadow: shellShadow,
              }}
            >
              <Grid
                container
                sx={{
                  minHeight: 100,
                  alignItems: "center",
                }}
              >
                <Grid size={3} p={2}>
                  <Box
                    className="player-achievement-percentage"
                    sx={{
                      position: "relative",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <CircularProgress
                      enableTrackSlot
                      value={formatProgress(ach)}
                      size={75}
                      variant="determinate"
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <div className="player-achievement-situation">
                        <EmojiEventsIcon
                          fontSize="large"
                          color={ach.unlocked ? "primary" : "disabled"}
                        />
                      </div>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={9} sx={{ alignItems: "flex-start", gap: 1 }}>
                  <CardContent>
                    <Typography variant="h6">
                      {ach.unlocked || ach.title_visible ? ach.title : "??????"}
                    </Typography>
                    <Typography variant="body2">
                      {ach.unlocked || ach.description_visible
                        ? ach.description
                        : "??????"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, display: "block" }}
                    >
                      {ach.category === "city" && ach.cities.length > 1 && (
                        <div>
                          Progresso:{" "}
                          {
                            citiesFound.filter((city) =>
                              ach.cities.includes(city.id),
                            ).length
                          }
                          /{ach.cities.length}
                        </div>
                      )}
                      {ach.category === "province" && (
                        <div>
                          Progresso:{" "}
                          {
                            citiesFound.filter(
                              (city) => city.provincia === ach.province,
                            ).length
                          }
                          /
                          {
                            cities.filter(
                              (city) => city.provincia === ach.province,
                            ).length
                          }
                        </div>
                      )}
                      Giocatori che hanno sbloccato: {ach.percentage}%
                    </Typography>
                  </CardContent>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
