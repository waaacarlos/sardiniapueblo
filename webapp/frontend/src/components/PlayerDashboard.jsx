import {
  Box,
  Paper,
  Button,
  Dialog,
  DialogContent,
  Fab,
  Grid,
  Typography,
  Alert,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GradeIcon from "@mui/icons-material/Grade";
import PlayerProgressCard from "./PlayerProgressCard";
import { useEffect, useState } from "react";
import InteractiveMap from "./InteractiveMap";
import PageHeader from "./PageHeader";
import { useTheme } from "@mui/material/styles";

const citiesCount = 377;

export default function PlayerDashboard({
  playerData,
  citiesFound,
  loading,
  unlockedAchs,
  totalAchievements,
  achievementsLoading,
  allCities,
}) {
  const theme = useTheme();

  //const playerPoints = citiesFound.length;
  //const playerPercentage = (playerPoints / citiesCount) * 100;
  const [playerPoints, setPlayerPoints] = useState(0);
  const [playerPercentage, setPlayerPercentage] = useState(0);
  //const safeTotalAchievements = totalAchievements || 1;
  //const achievementsPercentage =
  //  (unlockedAchievements / safeTotalAchievements) * 100;
  const [achievementsPercentage, setAchievementsPercentage] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState(0);
  const [safeTotalAchievements, setSafeTotalAchievements] = useState(1);
  const [mapOpen, setMapOpen] = useState(false);
  const [showMapInfo, setShowMapInfo] = useState(false);

  useEffect(() => {
    setShowMapInfo(false);
    if (mapOpen) {
      setShowMapInfo(true);
      setTimeout(() => {
        setShowMapInfo(false);
      }, 5000);
    }
  }, [mapOpen]);

  useEffect(() => {
    setSafeTotalAchievements(totalAchievements || 1);
    for (let i = 0; i <= unlockedAchs; i++) {
      setTimeout(
        () => {
          setUnlockedAchievements(i);
          setAchievementsPercentage((i / (totalAchievements || 1)) * 100);
        },
        (i * 200) / unlockedAchs,
      );
    }
  }, [totalAchievements, unlockedAchs]);

  useEffect(() => {
    for (let i = playerPoints; i <= citiesFound.length; i++) {
      setTimeout(
        () => {
          setPlayerPoints(i);
          setPlayerPercentage((i / citiesCount) * 100);
        },
        (i * 200) / citiesFound.length,
      );
    }
  }, [citiesFound]);

  const achievementsAction = {
    icon: <EmojiEventsIcon />,
    onClick: () => {
      window.location.href = `/?playerId=${playerData.id}&page=achs`;
    },
  };

  const [headerReady, setHeaderReady] = useState(false);

  useEffect(() => {
    setHeaderReady(true);
  }, [playerData]);

  return (
    <>
      <PageHeader ready={headerReady} title="Statistiche" />
      <Box
        className="card-container"
        sx={{ position: "relative", overflow: "hidden" }}
      >
        <Grid container spacing={2} sx={{ justifyContent: "center" }}>
          <Grid size={12}>
            <Paper
              sx={{
                p: 2,
                m: 2,
                justifyContent: "center",
                alignItems: "stretch",
                display: "flex",
                backgroundColor: theme.palette.app?.surface?.soft,
                boxShadow: theme.customShadows?.raisedInset,
              }}
              className="player-dashboard"
            >
              <Grid container spacing={2} sx={{ justifyContent: "center" }}>
                <Grid size={12}>
                  <PlayerProgressCard
                    loading={loading}
                    count={playerPoints}
                    percentage={playerPercentage}
                    total={citiesCount}
                    labelTop="Hai trovato"
                    labelBottom={`comuni su ${citiesCount}`}
                  />
                </Grid>
                <Grid container spacing={2} sx={{ justifyContent: "center" }}>
                  {playerData && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Fab
                          variant="extended"
                          href={`/?playerId=${playerData.id}&page=ranked`}
                        >
                          <GradeIcon />
                          Classifica
                        </Fab>
                      </Box>
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Fab variant="extended" onClick={() => setMapOpen(true)}>
                        <MapIcon />
                        Mappa
                      </Fab>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid size={12}>
            <Paper
              sx={{
                p: 2,
                m: 2,
                justifyContent: "center",
                alignItems: "stretch",
                display: "flex",
                backgroundColor: theme.palette.app?.surface?.soft,
                boxShadow: theme.customShadows?.raisedInset,
              }}
              className="player-dashboard"
            >
              <Grid container spacing={2} sx={{ justifyContent: "center" }}>
                <Grid size={12}>
                  <PlayerProgressCard
                    loading={achievementsLoading}
                    count={unlockedAchievements}
                    percentage={achievementsPercentage}
                    total={totalAchievements}
                    labelTop="Hai sbloccato"
                    labelBottom={`obiettivi su ${totalAchievements}`}
                  />
                </Grid>
                <Grid size={12}>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Fab
                      variant="extended"
                      onClick={achievementsAction.onClick}
                    >
                      <EmojiEventsIcon />
                      Vedi obiettivi
                    </Fab>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      <Dialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Typography variant="h5" align="center">
              Mappa interattiva
            </Typography>
          </Box>
          <Box
            sx={(theme) => ({
              display: "none",
              [theme.breakpoints.down(400)]: {
                display: "block",
              },
              position: "fixed",
              top: 0,
              left: 0,
              right: 0
            })}
          >
            <Alert severity="warning">
              La risoluzione del tuo dispositivo è troppo bassa. Potresti riscontrare difficoltà a visualizzare la mappa.
            </Alert>
          </Box>

          <InteractiveMap citiesFound={citiesFound} allCities={allCities} />

          <Alert
            severity="info"
            sx={{
              mt: 2,
              position: "fixed",
              bottom: 16,
              left: 16,
              right: 16,
              opacity: showMapInfo ? 1 : 0,
              transition: "opacity 0.5s",
            }}
          >
            Premi sulla mappa per visualizzare i dettagli.
          </Alert>
        </DialogContent>
      </Dialog>
    </>
  );
}
