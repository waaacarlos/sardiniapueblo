import React from "react";
import { Box } from "@mui/material";


export default function PlayerGreetings({ playerData }) {
  return (
    <div className="player-greetings-container">
      <Box className="player-greetings" sx={{ color: "primary.main" }}>
        Ciao {playerData ? playerData.firstname : ""}
      </Box>
      <div>
        Questa è la tua dashboard personale, dove potrai vedere i tuoi
        progressi.
      </div>
    </div>
  );
}
