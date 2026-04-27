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
} from "@mui/material";

export default function Ranked({ playerId, playerData, onPublicNameSaved }) {
  const [rankingData, setRankingData] = useState(null);
  const [reload, setReload] = useState(false);
  const [publicName, setPublicName] = useState(
    playerData?.public_name || playerData?.firstname || "",
  );

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
    fetch(`${API_URI}/api/getranked`)
      .then((response) => response.json())
      .then((data) => {
        setRankingData(data.filter((entry) => entry.public_name));
      })
      .catch((error) => console.error("Error fetching ranking data:", error));
  }, [playerId, reload]);

  const columns = [
    { id: "rank", label: "#", minWidth: 50, fontSize: "1.5em", align: "right" },
    { id: "fullname", label: "Giocatore", minWidth: 150 },
    // { id: "ach", label: "Obiettivi", minWidth: 50, align: "center" },
    { id: "acc", label: "Accuratezza", minWidth: 50, align: "center" },
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
      <>
        <div className="ranked">
          <h1>Classifica generale</h1>
        </div>
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: "80vh" }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      style={{ minWidth: column.minWidth }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rankingData &&
                  rankingData.map((row, index) => {
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={row["id"]}
                      >
                        {columns.map((column) => {
                          let value;
                          switch (column.id) {
                            case "rank":
                              value = index + 1;
                              break;
                            case "acc":
                              value =
                                (
                                  (row["points"] / row["attempts"]) *
                                  100
                                ).toFixed(0) + "%";
                              break;
                            default:
                              value = row[column.id];
                              break;
                          }
                          return (
                            <TableCell
                              key={`${row["id"]}-${column.id}`}
                              align={column.align}
                              style={{
                                fontSize: column.fontSize || "1em",
                                backgroundColor: column.bgColor || "inherit",
                              }}
                            >
                              {column.format && typeof value === "number"
                                ? column.format(value)
                                : value}
                              {column.id === "fullname" && (
                                <LinearProgress
                                  variant="determinate"
                                  value={(row["points"] / 377) * 100}
                                ></LinearProgress>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </>
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
            <p>
              Per poter visualizzare la classifica generale, è necessario che tu
              abbia un nome pubblico.
            </p>
            <h3>Con quale nome vuoi essere visualizzato nella classifica?</h3>
            {playerData && (
              <>
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
            )}
          </Box>
        </Paper>
      </Box>
    );
}
