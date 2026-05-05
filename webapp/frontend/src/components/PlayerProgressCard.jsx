import { Box, CircularProgress, Paper, Fab } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function PlayerProgressCard({
  loading,
  count,
  percentage,
  total,
  labelTop,
  labelBottom,
}) {
  const theme = useTheme();

  return (

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

  );
}
