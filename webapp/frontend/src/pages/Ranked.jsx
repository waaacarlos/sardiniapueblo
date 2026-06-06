import { useEffect, useState, useLayoutEffect, useRef } from "react";
import { Fab } from "@mui/material";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import EditIcon from "@mui/icons-material/Edit";
import { useTheme } from "@mui/material/styles";
import { API_URI } from "../api";
import PageHeader from "../components/PageHeader";

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
  const theme = useTheme();
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(0);
  const shellShadow = theme.customShadows?.raisedInset;
  const softShadow = theme.customShadows?.soft;
  const surfaceColors = theme.palette.app?.surface;
  const rankingColors = theme.palette.app?.ranking;
  const [rankingData, setRankingData] = useState(null);
  const [reload, setReload] = useState(false);
  const [publicName, setPublicName] = useState(
    playerData?.public_name || playerData?.firstname || "",
  );
  const [headerReady, setHeaderReady] = useState(false);
  const [editName, setEditName] = useState(false);
  const totalPages = Math.ceil((rankingData?.length || 0) / PAGE_SIZE);
  const start = currentPage * PAGE_SIZE;
  const pagedRanking = rankingData?.slice(start, start + PAGE_SIZE) || [];

  const listInnerRef = useRef(null);
  const [listHeight, setListHeight] = useState(null);

  useLayoutEffect(() => {
    if (!listInnerRef.current) return;

    const el = listInnerRef.current;
    const ro = new ResizeObserver(() => {
      setListHeight(Math.ceil(el.getBoundingClientRect().height));
    });

    ro.observe(el);
    setListHeight(Math.ceil(el.getBoundingClientRect().height));

    return () => ro.disconnect();
  }, [rankingData, currentPage]);

  const updatePublicName = async (nameToSave = publicName) => {
    try {
      const response = await fetch(
        `${API_URI}/api/user/${playerId}/public_name`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ public_name: nameToSave }),
        },
      );
      if (!response.ok) {
        console.error("PATCH failed:", response.status);
        return false;
      }
      onPublicNameSaved?.(nameToSave);
      setReload((prev) => !prev);
      return true;
    } catch (error) {
      console.error("Error updating public name:", error);
      return false;
    }
  };

  useEffect(() => {
    setPublicName(playerData?.public_name || playerData?.firstname || "");
    setEditName(false);
  }, [playerData]);

  useEffect(() => {
    setHeaderReady(false);
    fetch(`${API_URI}/api/getranked`)
      .then((response) => response.json())
      .then((data) => {
        let filtered = data
          .filter((entry) => entry.public_name)
          .map((entry, index) => ({
            ...entry,
            visible: false,
            displayStats: playerId == entry.id,
            ranking: index + 1,
          }));

        setRankingData(filtered);
        setTimeout(() => {
          setHeaderReady(true);
        }, 120);
        const playerIndex = filtered?.findIndex((p) => p.id == playerId);
        let newPage = 0;
        if (playerIndex !== undefined && playerIndex !== -1) {
          newPage = Math.floor(playerIndex / PAGE_SIZE);
        }
        setCurrentPage(newPage);
      })
      .catch((error) => console.error("Error fetching ranking data:", error));
  }, [playerId, reload]);

  useEffect(() => {
    if (!rankingData?.length) return;

    const pageStart = currentPage * PAGE_SIZE;
    const pageEnd = pageStart + PAGE_SIZE;
    const pageItems = rankingData.slice(pageStart, pageEnd);

    setRankingData((prev) =>
      prev.map((item, index) => ({ ...item, visible: false })),
    );

    const timeouts = pageItems.map((_, index) =>
      setTimeout(
        () => {
          setRankingData((prev) =>
            prev.map((item, itemIndex) =>
              itemIndex === pageStart + index
                ? { ...item, visible: true }
                : item,
            ),
          );
        },
        (index + 1) * 150,
      ),
    );

    return () => timeouts.forEach(clearTimeout);
  }, [currentPage, rankingData?.length]);

  const showPlayerStats = (id) => {
    setRankingData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, displayStats: !item.displayStats } : item,
      ),
    );
  };

  const header = <PageHeader ready={headerReady} title="Classifica" />;

  const pagination = [];
  for (let i = 0; i < Math.ceil(rankingData?.length / 10); i++) {
    let page;
    if (i === 0) page = "TOP 10";
    else page = i * 10 + 1 + "-" + (i + 1) * 10;
    pagination.push(page);
  }

  if (!playerId || (playerData && playerData.public_name && !editName))
    return (
      <Box className="ranked-container">
        {header}
        <Grid container>
          {pagination.map((page, i) => (
            <Grid size="auto" key={i}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Paper
                  onClick={() => setCurrentPage(i)}
                  sx={{
                    px: 2,
                    mx: 1,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1em",
                    backgroundColor:
                      i === currentPage
                        ? rankingColors?.highlight
                        : surfaceColors?.soft,
                    boxShadow: shellShadow,
                  }}
                >
                  {page}
                </Paper>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Box
          sx={{
            width: "100%",
            maxWidth: 900,
            mx: "auto",
            textShadow: "0 0 5px black",
          }}
        >
          <Box
            sx={{
              height: listHeight != null ? listHeight : "auto",
              overflow: "hidden",
              transition: "height 240ms ease",
            }}
          >
            <Box ref={listInnerRef} sx={{ display: "grid", rowGap: 2, py: 2 }}>
              {pagedRanking?.map((player, index) => (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    borderRadius: 3,
                    m: 0,
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
                              player.ranking === 1
                                ? rankingColors?.goldStrong
                                : player.id == playerId
                                  ? rankingColors?.highlight
                                  : surfaceColors?.soft,
                            boxShadow: shellShadow,
                          }}
                        >
                          {player.ranking}
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
                                ? rankingColors?.highlight
                                : player.ranking === 1
                                  ? rankingColors?.goldSoft
                                  : surfaceColors?.soft,
                            boxShadow: shellShadow,
                            transition:
                              "transform 0.2s ease, box-shadow 0.2s ease",
                          }}
                        >
                          <Grid
                            container
                            spacing={0}
                            sx={{ alignItems: "center" }}
                          >
                            <Grid size={{ xs: 12, sm: 9 }}>
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
                                {player.public_name}
                              </Box>
                            </Grid>
                            <Grid
                              size={{ xs: 4, lg: 1 }}
                              sx={{
                                maxHeight: player.displayStats
                                  ? "200px"
                                  : "0px",
                                overflow: "hidden",
                                opacity: player.displayStats ? 1 : 0,
                                transform: player.displayStats
                                  ? "translateY(0)"
                                  : "translateY(-10px)",
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
                                {((player.points / 377) * 100).toFixed(0)}%
                              </Box>
                            </Grid>
                            <Grid
                              size={{ xs: 4, lg: 1 }}
                              sx={{
                                maxHeight: player.displayStats
                                  ? "200px"
                                  : "0px",
                                overflow: "hidden",
                                opacity: player.displayStats ? 1 : 0,
                                transform: player.displayStats
                                  ? "translateY(0)"
                                  : "translateY(-10px)",
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
                                {(
                                  (player.points / player.attempts) *
                                  100
                                ).toFixed(0)}
                                %
                              </Box>
                            </Grid>
                            <Grid
                              size={{ xs: 4, lg: 1 }}
                              sx={{
                                maxHeight: player.displayStats
                                  ? "200px"
                                  : "0px",
                                overflow: "hidden",
                                opacity: player.displayStats ? 1 : 0,
                                transform: player.displayStats
                                  ? "translateY(0)"
                                  : "translateY(-10px)",
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
                              <Box
                                className="progress-bar"
                                sx={{ pl: 2, pr: 2 }}
                              >
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
                                ? rankingColors?.goldSoft
                                : player.id == playerId
                                  ? rankingColors?.highlight
                                  : surfaceColors?.subtle,
                            boxShadow: shellShadow,
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
        </Box>
        {playerId && (
          <Box className="actions-container">
            <Fab variant="extended" onClick={() => setEditName(true)}>
              <EditIcon />
              Cambia nome
            </Fab>
            <Fab variant="extended" href={`/?playerId=${playerData.id}`}>
              <DataUsageIcon />
              Statistiche
            </Fab>
          </Box>
        )}
      </Box>
    );
  else if (playerId || editName)
    return (
      <>
        {header}
        <Box
          sx={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
            {playerData ? (
              <>
                <p>
                  Per poter apparire nella classifica generale, è necessario che
                  tu abbia un nome pubblico.
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
                  color="primary"
                  onClick={() => updatePublicName()}
                >
                  Continua
                </Button>
                <p></p>
                <p>Non vuoi apparire nella classifica?</p>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={async () => {
                    const ok = await updatePublicName("");
                    if (ok) {
                      window.location.href = "/?page=ranked";
                    }
                  }}
                >
                  Vai alla classifica
                </Button>
              </>
            ) : (
              <p>Caricamento in corso...</p>
            )}
          </Box>
        </Box>
      </>
    );
}
