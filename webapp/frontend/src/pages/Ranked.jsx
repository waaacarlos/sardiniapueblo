import { useEffect, useState } from "react";
import { API_URI } from "../api";
import {
  // CircularProgress,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  TextField,
  Button,
  Grid,
} from "@mui/material";

export default function Ranked({ playerId, playerData, onPublicNameSaved }) {
  const [rankingData, setRankingData] = useState(null);
  const [reload, setReload] = useState(false);
  const [publicName, setPublicName] = useState(
    playerData?.public_name || playerData?.firstname || "",
  );
  const [headerReady, setHeaderReady] = useState(false);

  const updatePublicName = async () => {
    try {
      const response = await fetch(
        `${API_URI}/api/user/${playerId}/public_name`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ public_name: publicName }),
        },
      );
      if (!response.ok) {
        console.error("PATCH failed:", response.status);
        return;
      }
      onPublicNameSaved?.(publicName);
      setReload((prev) => !prev);
    } catch (error) {
      console.error("Error updating public name:", error);
    }
  };

  useEffect(() => {
    setPublicName(playerData?.public_name || playerData?.firstname || "");
  }, [playerData]);

  useEffect(() => {
    setHeaderReady(false);
    fetch(`${API_URI}/api/getranked`)
      .then((response) => response.json())
      .then((data) => {
        const filtered = data
          .filter((entry) => entry.public_name)
          .map((entry) => ({
            ...entry,
            visible: false,
            displayStats: playerId == entry.id,
          }));

        setRankingData(filtered);
        setTimeout(() => {
          setHeaderReady(true);
        }, 120);

        filtered.forEach((_, index) => {
          setTimeout(
            () => {
              setRankingData((prev) =>
                prev.map((item, i) =>
                  i === index ? { ...item, visible: true } : item,
                ),
              );
            },
            (index + 1) * 150,
          );
        });

        console.log("Fetched ranking data:", filtered);
      })
      .catch((error) => console.error("Error fetching ranking data:", error));
  }, [playerId, reload]);

  const showPlayerStats = (id) => {
    setRankingData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, displayStats: !item.displayStats } : item,
      ),
    );
  };

  const columns = [
    { id: "rank", label: "#", minWidth: 50, fontSize: "1.5em", align: "right" },
    { id: "public_name", label: "Giocatore", minWidth: 150 },
    // { id: "ach", label: "Obiettivi", minWidth: 50, align: "center" },
    { id: "acc", label: "Acc.", minWidth: 50, align: "center" },
    {
      id: "points",
      label: "Punti",
      minWidth: 50,
      align: "right",
      fontSize: "2em",
      bgColor: "primary.dark",
    },
  ];
  if (!playerId || (playerData && playerData.public_name))
    return (
      <Box className="ranked-container">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "90vw",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 3,
              transition:
                "transform 500ms ease, opacity 500ms ease, box-shadow 500ms ease",
              transform: headerReady ? "translateY(0)" : "translateY(-10px)",
              opacity: headerReady ? 1 : 0,
              backgroundColor: "#06142BAA",
              boxShadow: headerReady
                ? "0 10px 24px rgba(0,0,0,0.3), inset 0 -2px 8px rgba(212, 165, 116, 0.2)"
                : "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Box className="uela" sx={{ textShadow: "0 0 10px black" }}>
              <h1>CLASSIFICA GENERALE</h1>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            width: "100%",
            maxWidth: 900,
            mx: "auto",
            textShadow: "0 0 5px black",
          }}
        >
          {rankingData?.map((player, index) => (
            <Box
              key={player.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                flexWrap: "wrap",
                justifyContent: "center",
                borderRadius: 3,
                m: 2,
              }}
              onClick={() => showPlayerStats(player.id)}
            >
              <Grid
                container
                spacing={2}
                wrap="wrap"
                sx={{
                  opacity: player.visible ? 1 : 0,
                  transform: player.visible
                    ? "translateY(0)"
                    : "translateY(-10px)",
                  transition: "all 0.5s ease-in-out",
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Grid size="auto">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Paper
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5em",
                        backgroundColor:
                          index === 0
                            ? "#a67c52AA"
                            : player.id == playerId
                              ? "#0d6b8740"
                              : "#06142B80",
                        boxShadow:
                          "0 10px 24px rgba(0,0,0,0.3), inset 0 -2px 8px rgba(212, 165, 116, 0.2)",
                      }}
                    >
                      {index + 1}
                    </Paper>
                  </Box>
                </Grid>
                <Grid size="grow">
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                    }}
                  >
                    <Paper
                      sx={{
                        width: "100%",
                        minHeight: 50,
                        borderRadius: 3,
                        backgroundColor:
                          player.id == playerId
                            ? "#0d6b8740"
                            : index === 0
                              ? "#a67c5240"
                              : "#06142B80",
                        boxShadow:
                          "0 10px 24px rgba(0,0,0,0.3), inset 0 -2px 8px rgba(212, 165, 116, 0.2)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      }}
                    >
                      <Grid container spacing={0} sx={{ alignItems: "center" }}>
                        <Grid size={{ xs: 12, lg: 9 }}>
                          <Box
                            sx={{
                              width: "100%",
                              minHeight: "100%",
                              pt: 0.5,
                              pl: 2,
                              pb: 0,
                              fontSize: "1.2em",
                              letterSpacing: "0.05em",
                              transition: "all 1s ease",
                            }}
                          >
                            {player.public_name.toUpperCase()}
                          </Box>
                        </Grid>
                        <Grid
                          size={{ xs: 3, lg: 1 }}
                          sx={{
                            maxHeight: player.displayStats ? "200px" : "0px",
                            overflow: "hidden",
                            opacity: player.displayStats ? 1 : 0,
                            transform: player.displayStats
                              ? "translateY(0)"
                              : "translateY(-20px)",
                            transition: "all 0.5s ease",
                            scale: player.displayStats ? 1 : 0.8,
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              pt: 0.5,
                              pl: 2,
                              pb: 0,
                              pr: 2,
                              fontSize: "0.4em",
                              letterSpacing: "0.01em",
                              color: "text.secondary",
                              textAlign: "center",
                            }}
                          >
                            Trovati
                          </Box>
                          <Box
                            sx={{
                              width: "100%",
                              transition: "all 1s ease",
                              pt: 0,
                              pl: 2,
                              pb: 0,
                              pr: 2,
                              fontSize: "0.8em",
                              letterSpacing: "0.05em",
                              color: "text.secondary",
                              textAlign: "center",
                            }}
                          >
                            {((player.points / 377) * 100).toFixed(
                              0,
                            )}
                            %
                          </Box>
                        </Grid>
                        <Grid
                          size={{ xs: 3, lg: 1 }}
                          sx={{
                            maxHeight: player.displayStats ? "200px" : "0px",
                            overflow: "hidden",
                            opacity: player.displayStats ? 1 : 0,
                            transform: player.displayStats
                              ? "translateY(0)"
                              : "translateY(-20px)",
                            transition: "all 0.5s ease",
                            scale: player.displayStats ? 1 : 0.8,
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              pt: 0.5,
                              pl: 2,
                              pb: 0,
                              pr: 2,
                              fontSize: "0.4em",
                              letterSpacing: "0.01em",
                              color: "text.secondary",
                              textAlign: "center",
                            }}
                          >
                            Accuratezza
                          </Box>
                          <Box
                            sx={{
                              width: "100%",
                              transition: "all 1s ease",
                              pt: 0,
                              pl: 2,
                              pb: 0,
                              pr: 2,
                              fontSize: "0.8em",
                              letterSpacing: "0.05em",
                              color: "text.secondary",
                              textAlign: "center",
                            }}
                          >
                            {((player.points / player.attempts) * 100).toFixed(
                              0,
                            )}
                            %
                          </Box>
                        </Grid>
                        <Grid
                          size={{ xs: 3, lg: 1 }}
                          sx={{
                            maxHeight: player.displayStats ? "200px" : "0px",
                            overflow: "hidden",
                            opacity: player.displayStats ? 1 : 0,
                            transform: player.displayStats
                              ? "translateY(0)"
                              : "translateY(-20px)",
                            transition: "all 0.5s ease",
                            scale: player.displayStats ? 1 : 0.8,
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              pt: 0.5,
                              pl: 2,
                              pb: 0,
                              pr: 2,
                              fontSize: "0.4em",
                              letterSpacing: "0.01em",
                              color: "text.secondary",
                              textAlign: "center",
                            }}
                          >
                            Obiettivi
                          </Box>
                          <Box
                            sx={{
                              width: "100%",
                              transition: "all 1s ease",
                              pt: 0,
                              pl: 2,
                              pb: 0,
                              pr: 2,
                              fontSize: "0.8em",
                              letterSpacing: "0.05em",
                              color: "text.secondary",
                              textAlign: "center",
                            }}
                          >
                            {player.ach}
                            
                          </Box>
                        </Grid>
                        <Grid size={12}>
                          <Box className="progress-bar" sx={{ pl: 2, pr: 2 }}>
                            <LinearProgress
                              variant="determinate"
                              value={(player.points / 377) * 100}
                              sx={{
                                width: "100%",
                                borderRadius: 5,
                              }}
                              color="primary"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                </Grid>
                <Grid size="auto">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Paper
                      sx={{
                        width: 75,
                        minHeight: 50,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5em",
                        backgroundColor:
                          player.points === 377
                            ? "#a67c5240"
                            : index === 0
                              ? "#a67c5240"
                              : player.id == playerId
                                ? "#0d6b8740"
                                : "#06142B40",
                        boxShadow:
                          "0 10px 24px rgba(0,0,0,0.3), inset 0 -2px 8px rgba(212, 165, 116, 0.2)",
                      }}
                    >
                      {player.points}
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Box>
      </Box>
    );
  else if (playerId)
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <Box
            className="uela"
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h1>Ciao, {playerData ? playerData.firstname : "giocatore"}!</h1>

            {playerData ? (
              <>
                <p>
                  Per poter visualizzare la classifica generale, è necessario
                  che tu abbia un nome pubblico.
                </p>
                <h3>
                  Con quale nome vuoi essere visualizzato nella classifica?
                </h3>
                <TextField
                  label="Nome pubblico"
                  variant="filled"
                  value={publicName}
                  onChange={(e) => {
                    setPublicName(e.target.value);
                  }}
                ></TextField>
                <h6>
                  Premendo su Continua accetti che il nome scelto appaia nella
                  classifica. Per favore, usa un nome appropriato.
                </h6>
                <Button
                  variant="contained"
                  color="success"
                  onClick={updatePublicName}
                >
                  Continua
                </Button>
              </>
            ) : (
              <p>Caricamento in corso...</p>
            )}
          </Box>
        </Paper>
      </Box>
    );
}
