import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import './index.css'
import App from './App.jsx'

const appColors = {
  pageBg: "#f0f0f0",
  appBg: "#06142B",
  paper: "#0B234A",
  primary: "#6887b9",
  primaryActive: "#1976d2",
  primaryActiveHover: "#1565c0",
  primaryActiveStroke: "#0d47a1",
  textPrimary: "#EAF2FF",
  textSecondary: "#B8C8E6",
  textMuted: "#888",
  highlight: "#0d6b87",
  highlightSoft: "#0d6b8740",
  gold: "#a67c52",
  goldStrong: "#a67c52AA",
  goldSoft: "#a67c5240",
  surfaceStrong: "#06142BAA",
  surfaceSoft: "#06142B80",
  surfaceSubtle: "#06142B40",
  mapBase: "#f8c300",
  mapBaseHover: "#f0a500",
  mapNeutral: "#cccccc",
  mapNeutralHover: "#aaaaaa",
  mapFound: "#4caf50",
  mapFoundHover: "#2e7d32",
};

const appShadows = {
  raisedInset:
    "0 10px 24px rgba(0,0,0,0.3), inset 0 -2px 8px rgba(212, 165, 116, 0.2)",
  soft: "0 2px 8px rgba(0,0,0,0.08)",
};

const theme = createTheme({
  typography: {
    fontFamily: '"Google Sans", sans-serif',
  },
  palette: {
    mode: "dark",
    primary: { main: appColors.primary, contrastText: appColors.textPrimary },
    background: { default: appColors.appBg, paper: appColors.paper },
    text: { primary: appColors.textPrimary, secondary: appColors.textSecondary },
    app: {
      pageBg: appColors.pageBg,
      surface: {
        strong: appColors.surfaceStrong,
        soft: appColors.surfaceSoft,
        subtle: appColors.surfaceSubtle,
      },
      ranking: {
        highlight: appColors.highlightSoft,
        goldStrong: appColors.goldStrong,
        goldSoft: appColors.goldSoft,
      },
      map: {
        base: appColors.mapBase,
        baseHover: appColors.mapBaseHover,
        neutral: appColors.mapNeutral,
        neutralHover: appColors.mapNeutralHover,
        selected: appColors.primaryActive,
        selectedHover: appColors.primaryActiveHover,
        selectedStroke: appColors.primaryActiveStroke,
        found: appColors.mapFound,
        foundHover: appColors.mapFoundHover,
      },
      text: {
        muted: appColors.textMuted,
      },
    },
  },
  customShadows: appShadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--color-page-bg": appColors.pageBg,
          "--color-app-bg": appColors.appBg,
          "--color-paper": appColors.paper,
          "--color-primary": appColors.primary,
          "--color-text-primary": appColors.textPrimary,
          "--color-text-secondary": appColors.textSecondary,
          "--color-text-muted": appColors.textMuted,
          "--color-surface-strong": appColors.surfaceStrong,
          "--color-surface-soft": appColors.surfaceSoft,
          "--color-surface-subtle": appColors.surfaceSubtle,
          "--color-highlight": appColors.highlight,
          "--color-highlight-soft": appColors.highlightSoft,
          "--color-gold": appColors.gold,
          "--color-gold-strong": appColors.goldStrong,
          "--color-gold-soft": appColors.goldSoft,
          "--color-map-base": appColors.mapBase,
          "--color-map-base-hover": appColors.mapBaseHover,
          "--color-map-neutral": appColors.mapNeutral,
          "--color-map-neutral-hover": appColors.mapNeutralHover,
          "--color-map-selected": appColors.primaryActive,
          "--color-map-selected-hover": appColors.primaryActiveHover,
          "--color-map-selected-stroke": appColors.primaryActiveStroke,
          "--color-map-found": appColors.mapFound,
          "--color-map-found-hover": appColors.mapFoundHover,
          "--app-shell-shadow": appShadows.raisedInset,
          "--app-shell-shadow-soft": appShadows.soft,
          "--app-bg": appColors.appBg,
        },
      },
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
