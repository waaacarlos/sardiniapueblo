import { Box, CircularProgress, Paper } from "@mui/material";

export default function PlayerProgressCard({
  loading,
  count,
  percentage,
  total,
  labelTop = "Hai trovato",
  labelBottom,
}) {
  return (
    <Paper
      sx={{
        p: 2,
        m: 2,
        justifyContent: "center",
        alignItems: "stretch",
        display: "flex",
      }}
      className="player-dashboard"
    >
      <Box
        className="player-percentage"
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
            alignItems: "center",
        }}
      >
        <CircularProgress
          enableTrackSlot
          value={percentage}
          size={200}
          variant={loading ? "indeterminate" : "determinate"}
        />
        {!loading && (
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
            <div className="player-points-text">{labelTop}</div>
            <div className="player-points">{count}</div>
            {labelBottom && (
              <div className="player-points-text">{labelBottom}</div>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
}