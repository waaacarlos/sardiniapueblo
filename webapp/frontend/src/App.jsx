import { Box, Paper, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { useEffect, useState } from "react";
import { ADMIN_CHAT_ID, API_URI } from "./api";
import "./App.css";
import PlayerDashboard from "./components/PlayerDashboard";
import Achievements from "./pages/Achievements";
import Login from "./pages/Login";
import InteractiveMap from "./components/InteractiveMap";
import SardiniaShape from "./components/SardiniaShape";
import Ranked from "./pages/Ranked";
import PlayerAchievement from "./pages/PlayerAchievement";

function App() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("playerId");
  const page = params.get("page");
  const [playerData, setPlayerData] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [citiesFound, setCitiesFound] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState(0);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URI}/api/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Webapp aperta " + window.location.search,
      }),
    });
  }, []);

  useEffect(() => {
    if (playerData) {
      fetch(`${API_URI}/api/player/cities?player_id=${playerData.id}`)
        .then((response) => response.json())
        .then((data) => {
          setCitiesFound(data);
        })
        .catch((error) =>
          console.error("Error fetching player points:", error),
        );

      setAchievementsLoading(true);
      fetch(`${API_URI}/api/player/achievements?player_id=${playerData.id}`)
        .then((response) => response.json())
        .then((data) => {
          setUnlockedAchievements(
            Array.isArray(data) ? data.filter((ach) => ach.unlocked).length : 0,
          );
          setTotalAchievements(Array.isArray(data) ? data.length : 1);
        })
        .catch((error) =>
          console.error("Error fetching player achievements:", error),
        )
        .finally(() => setAchievementsLoading(false));
    }
  }, [playerData]);

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
    } else setLoading(false);
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
        appbody = <Achievements onLogout={handleLogout} cities={cities} />;
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
  } // TODO MOMENTANEO in attesa di aggiustare il server
  else if (false) {
    appbody = (
      <>
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          La sezione è temporaneamente disabilitata.
        </Typography>
        <Typography variant="body1" align="center" sx={{ mt: 2 }}>
          Sto cercando di risolvere al più presto.
        </Typography>
      </>
    );
  } else if (page === "ranked") {
    appbody = (
      <Ranked
        playerId={playerId}
        playerData={playerData}
        onPublicNameSaved={(name) =>
          setPlayerData((prev) =>
            prev ? { ...prev, public_name: name } : prev,
          )
        }
      />
    );
  } else if (page === "achs") {
    appbody = (
      <PlayerAchievement
        playerId={playerId}
        playerData={playerData}
        citiesFound={citiesFound}
        cities={cities}
      ></PlayerAchievement>
    );
  } else if (playerId) {
    appbody = (
      <Box sx={{ p: 2 }}>
        <PlayerDashboard
          playerData={playerData}
          citiesFound={citiesFound}
          loading={loading}
          unlockedAchs={unlockedAchievements}
          totalAchievements={totalAchievements}
          achievementsLoading={achievementsLoading}
        />
      </Box>
    );
  } else {
    appbody = (
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <InteractiveMap citiesFound={cities}></InteractiveMap>
        </Paper>
      </Box>
    );
  }

  return (
    <div className="App">
      <div className="sardinia-bg">
        <div className="sardinia-border-gradient" />
        <SardiniaShape />
      </div>
      <Box sx={{ flexGrow: 1 }}>
        {authenticated && (
          <Button onClick={handleLogout} color="inherit">
            Logout
          </Button>
        )}
      </Box>
      <div className="content">{appbody}</div>

      <Paper
        sx={{ margin: 1, bottom: 0, left: 0, right: 0, position: "fixed" }}
        elevation={3}
        onClick={() => {
          if (!playerId || playerId == ADMIN_CHAT_ID) setShowLogin(true);
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <div className="footer-text">
            Copyright © 2026 Sardinia Pueblo. Tutti i diritti riservati.
            <br />
            Mappe e immagini: Wikipedia Commons Vonvikken CC BY-SA
          </div>
        </Box>
      </Paper>
    </div>
  );
}

export default App;
