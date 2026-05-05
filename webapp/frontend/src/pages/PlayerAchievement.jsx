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
import LocationCityIcon from "@mui/icons-material/LocationCity";
import MapsHomeWorkIcon from "@mui/icons-material/MapsHomeWork";
import PageHeader from "../components/PageHeader";

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
            (index + 1) * 100,
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
      <PageHeader ready={headerReady} title="Obiettivi" showBack></PageHeader>
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
                        {ach.category === "province" ? (
                          <LocationCityIcon
                            fontSize="large"
                            color={ach.unlocked ? "warning" : "disabled"}
                          />
                        ) : ach.category === "city" ? (
                          <MapsHomeWorkIcon
                            fontSize="large"
                            color={ach.unlocked ? "warning" : "disabled"}
                          />
                        ) : (
                          <EmojiEventsIcon
                            fontSize="large"
                            color={ach.unlocked ? "warning" : "disabled"}
                          />
                        )}
                      </div>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={9} sx={{ alignItems: "flex-start", gap: 1 }}>
                  <CardContent>
                    {ach.unlocked || ach.title_visible ? (
                      <Typography variant="h6">{ach.title}</Typography>
                    ) : (
                      <Box
                        sx={{
                          width: "80%",
                          backgroundColor: rankingColors?.highlight,
                          borderRadius: 1,
                          textAlign: "center",
                          textTransform: "uppercase",
                          color: "text.secondary",
                          textShadow: "0 0 5px black",
                          pointerEvents: "none",
                          fontSize: "1rem",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Obiettivo nascosto
                      </Box>
                    )}

                    {ach.unlocked || ach.description_visible ? (
                      <Typography variant="body2">{ach.description}</Typography>
                    ) : (
                      <Box
                        sx={{
                          width: "80%",
                          backgroundColor: rankingColors?.highlight,
                          borderRadius: 1,
                          textAlign: "center",
                          textTransform: "uppercase",
                          color: "text.secondary",
                          textShadow: "0 0 5px black",
                          pointerEvents: "none",
                          fontSize: "0.75rem",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Descrizione nascosta
                      </Box>
                    )}

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
      {playerId && (
        <Box sx={{ position: "fixed", bottom: "9vh", right: "4vw" }}>
          <Fab variant="extended" href={`/?playerId=${playerData.id}`}>
            <DataUsageIcon />
            Statistiche
          </Fab>
        </Box>
      )}
    </div>
  );
}
