import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import './index.css'
import App from './App.jsx'

const theme = createTheme({
  typography: {
    fontFamily: '"Google Sans", sans-serif',
  },
  palette: {
    mode: "dark",
    primary: { main: "#6887b9", contrastText: "#EAF2FF" },
    background: { default: "#06142B", paper: "#0B234A" },
    text: { primary: "#EAF2FF", secondary: "#B8C8E6" },
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
