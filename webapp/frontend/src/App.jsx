import { use, useEffect, useState } from "react";
import { AppBar, Box, Toolbar, Typography, Paper } from "@mui/material";
import Button from "@mui/material/Button";
import Login from "./pages/Login";
import Achievements from "./pages/Achievements";
import PlayerDashboard from "./components/PlayerDashboard";
import { API_URI, ADMIN_CHAT_ID } from "./api";
import "./App.css";

function App() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("playerId");
  const [playerData, setPlayerData] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetch(`${API_URI}/api/all_cities`)
      .then((response) => response.json())
      .then((data) => setCities(data))
      .catch((error) => console.error("Error fetching cities:", error));
  }, []);

  useEffect(() => {
    if (playerId && !playerData) {
      fetch(`${API_URI}/api/player?player_id=${playerId}`)
        .then((response) => response.json())
        .then((data) => setPlayerData(data))
        .catch((error) => console.error("Error fetching player data:", error))
        .finally(() => setLoading(false));
    }
    else setLoading(false);
  }, [playerId]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      setAuthenticated(false);
      setShowLogin(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthenticated(false);
      return;
    }
    fetch(API_URI + "/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        setAuthenticated(response.ok);
      })
      .catch((error) =>
        console.error("Error fetching authentication status:", error),
      );
  }, []);

  let appbody;

  if (showLogin) {
    switch (authenticated) {
      case true:
        appbody = <Achievements onLogout={handleLogout} cities={cities}/>;
        break;
      case false:
        appbody = (
          <Login
            onLogin={() => setAuthenticated(true)}
            onExit={() => setShowLogin(false)}
          />
        );
        break;
      default:
        appbody = <h1>Loading...</h1>;
        break;
    }
  } else {
    appbody = (
      <Box sx={{ p: 2 }}>
        <PlayerDashboard playerData={playerData} loading={loading} />
      </Box>
    );
  }

  return (
    <div className="App">
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed" sx={{ backgroundColor: "primary" }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Sardinia Pueblo
            </Typography>

            {authenticated && (
              <Button onClick={handleLogout} color="inherit">
                Logout
              </Button>
            )}
          </Toolbar>
        </AppBar>
      </Box>
      <div className="content">{appbody}</div>
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0}}
        elevation={3}
        onClick={() => {if(!playerId || playerId == ADMIN_CHAT_ID) setShowLogin(true)}}
      >
        <Box sx={{ textAlign: "center" }}>
          <div className="footer-text">Copyright © 2026 Sardinia Pueblo. Tutti i diritti riservati. Mappe e immagini: Wikipedia Commons Vonvikken CC BY-SA</div>
        </Box>
      </Paper>
    </div>
  );
}

export default App;
