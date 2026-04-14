import PlayerGreetings from "./PlayerGreetings";
import { useEffect, useState } from "react";
import { Box, LinearProgress, Paper, Chip } from "@mui/material";
import InteractiveMap from "./InteractiveMap";

const citiesCount = 377;

export default function PlayerDashboard({ playerData }) {
  const [cities, setCities] = useState([]);
  const [citiesFound, setCitiesFound] = useState([]);
  const [playerPoints, setPlayerPoints] = useState(0);

  const [playerPercentage, setPlayerPercentage] = useState(0);

  useEffect(() => {
    if (playerData) {
      fetch(`/api/player/cities?player_id=${playerData.id}`)
        .then((response) => response.json())
        .then((data) => {
          setCitiesFound(data);
          const points = data.length
          setPlayerPoints(points);
          setPlayerPercentage((points / citiesCount) * 100);
        })
        .catch((error) =>
          console.error("Error fetching player points:", error),
        );
    }
  }, [playerData]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 2,
        justifyContent: "center",
        alignItems: "center",
      }}
      className="player-dashboard"
    >
      <Paper sx={{ p: 2, m: 2 }} className="player-dashboard">
        <PlayerGreetings playerData={playerData} />
      </Paper>
      <Paper sx={{ p: 2, m: 2 }} className="player-dashboard">
        <div className="player-points">
          Hai trovato {playerPoints} comuni su {citiesCount}
        </div>
        <LinearProgress
          value={playerPercentage}
          sx={{ mt: 2 }}
          variant="determinate"
        />
      </Paper>

      <Paper sx={{ p: 2, m: 2 }} className="player-dashboard">
        <InteractiveMap citiesFound={citiesFound} />
      </Paper>
    </Box>
  );
}
