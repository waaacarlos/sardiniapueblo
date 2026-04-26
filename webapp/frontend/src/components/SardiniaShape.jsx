import sardiniaSvg from "../../assets/sardinia.svg?raw";
import { Box } from "@mui/material";

function injectStyle(svgText, css) {
  let result = svgText;

  // Inietta viewBox se assente, necessario per il CSS scaling
  if (!result.includes("viewBox")) {
    const w = result.match(/\bwidth="([^"]+)"/)?.[1];
    const h = result.match(/\bheight="([^"]+)"/)?.[1];
    if (w && h) {
      result = result.replace("<svg", `<svg viewBox="0 0 ${w} ${h}"`);
    }
  }

  return result.replace(/<svg([^>]*)>/, `<svg$1><style>${css}</style>`);
}

const map = injectStyle(
  sardiniaSvg,
  `
    svg g, svg path {
      fill: var(--app-bg, #f0f0f0) !important;
    }

    svg path {
      stroke: none !important;
    }
  `,
);

export default function SardiniaShape() {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: map }}
      sx={{
        transition: "all 0.3s ease",
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        animation: "fadeIn 0.35s ease",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "scale(0.97)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        "& svg": {
          width: "auto",
          height: "auto",
          display: "block",
          maxHeight: "calc(100vh - 180px)",
          maxWidth: "100%",
        },
      }}
    ></Box>
  );
}
