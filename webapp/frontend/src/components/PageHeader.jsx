import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function PageHeader({
  ready,
  title,
  width = "90vw",
  variant = "h3",
}) {
  const theme = useTheme();
  const softShadow = theme.customShadows?.soft;
  const surfaceColors = theme.palette.app?.surface;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 3,
          backgroundColor: surfaceColors?.strong,
          boxShadow: softShadow,
        }}
      >
        <Box
          sx={{
            textShadow: "0 0 10px black",
          }}
        >
          
          <Box
            sx={{
              p: 2,
              m: 2,
              fontSize: "2rem",
              fontWeight: "bold",
              letterSpacing: ready ? "normal" : "0.5em",
              minHeight: ready ? "0" : "90vh",
              transition: "all 1s ease",
              alignItems: "center",
              display: "flex",
              gap: 2,
              justifyContent: "center",
            }}
          >
            <Typography variant={variant}>{title}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
