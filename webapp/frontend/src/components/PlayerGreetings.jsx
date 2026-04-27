import React from "react";
import { Box } from "@mui/material";


export default function PlayerGreetings({ playerData }) {
  return (
    <div className="player-greetings-container">
      <Box className="player-greetings">
        Ciao {playerData ? playerData.firstname : ""}
      </Box>
    </div>
  );
}
