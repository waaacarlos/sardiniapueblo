import PlayerGreetings from "./PlayerGreetings";
import { Box, Paper, Button, Dialog, DialogContent, Fab } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import GradeIcon from "@mui/icons-material/Grade";
import PlayerProgressCard from "./PlayerProgressCard";
import { useState } from "react";
import InteractiveMap from "./InteractiveMap";

const citiesCount = 377;

export default function PlayerDashboard({
  playerData,
  citiesFound,
  loading,
  unlockedAchievements,
  totalAchievements,
  achievementsLoading,
}) {
  const playerPoints = citiesFound.length;
  const playerPercentage = (playerPoints / citiesCount) * 100;
  const safeTotalAchievements = totalAchievements || 1;
  const achievementsPercentage =
    (unlockedAchievements / safeTotalAchievements) * 100;

  const [mapOpen, setMapOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
        className="player-dashboard"
      >
        <PlayerGreetings playerData={playerData} />
      </Box>
      <Box
        className="card-container"
        sx={{ position: "relative", overflow: "hidden" }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <PlayerProgressCard
            loading={loading}
            count={playerPoints}
            percentage={playerPercentage}
            total={citiesCount}
            labelTop="Hai trovato"
            labelBottom={`comuni su ${citiesCount}`}
          />
          <PlayerProgressCard
            loading={achievementsLoading}
            count={unlockedAchievements}
            percentage={achievementsPercentage}
            total={totalAchievements}
            labelTop="Hai sbloccato"
            labelBottom={`obiettivi su ${totalAchievements}`}
          />
        </Box>
        <Dialog
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent>
            <InteractiveMap citiesFound={citiesFound} />
          </DialogContent>
        </Dialog>
        <Box className="actions-container">
          {playerData && (
            <Fab
              variant="extended"
              href={`/?playerId=${playerData.id}&page=ranked`}
            >
              <GradeIcon />
              Classifica
            </Fab>
          )}

          <Fab variant="extended" onClick={() => setMapOpen(true)}>
            <MapIcon />
            Mappa
          </Fab>
        </Box>
      </Box>
    </>
  );
}
