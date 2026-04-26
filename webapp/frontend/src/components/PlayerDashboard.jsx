import PlayerGreetings from "./PlayerGreetings";
import { Box, Paper, Button, Dialog, DialogContent } from "@mui/material";
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
        <Paper sx={{ p: 2, width: "100%" }} className="player-dashboard">
          <PlayerGreetings playerData={playerData} />
        </Paper>
      </Box>
      <Box sx={{ position: "relative", overflow: "hidden" }}>
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
        <Box sx={{ display: "flex", justifyContent: "center", pb: 2 }}>
          <Button variant="outlined" onClick={() => setMapOpen(true)}>
            Mostra mappa
          </Button>
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
      </Box>
    </>
  );
}
