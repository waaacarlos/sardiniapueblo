import { Box, CircularProgress, Paper, Fab } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function PlayerProgressCard({
  loading,
  count,
  percentage,
  total,
  labelTop,
  labelBottom,
  action
}) {
  const theme = useTheme();

  return (
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
        {action && (
          <Fab
            size="small"
            sx={{ position: "absolute", bottom: 2, right: 2 }}
            onClick={action.onClick}
          >
            {action.icon}
          </Fab>
        )}
      </Box>
    </Paper>
  );
}
