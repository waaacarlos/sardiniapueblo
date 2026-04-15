import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";

const categoryLabels = {
  progress: "Progresso",
  city: "Città",
  province: "Provincia",
  write: "Scritto",
};

export default function AchievementList({ achievements, onEdit, onDelete }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  const handleDeleteClick = (key) => {
    setSelectedKey(key);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedKey) {
      onDelete(selectedKey);
    }
    setDeleteDialogOpen(false);
    setSelectedKey(null);
  };

  const getDetailsText = (achievement) => {
    switch (achievement.category) {
      case "progress":
        return `Soglia: ${achievement.threshold}`;
      case "city":
        return `${achievement.cities?.length || 0} città`;
      case "province":
        return `Provincia: ${achievement.province}`;
      case "write":
        return `Evento: ${achievement.event}`;
      default:
        return "";
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell header="true" sx={{ fontWeight: "bold" }}>
                Key
              </TableCell>
              <TableCell header="true" sx={{ fontWeight: "bold" }}>
                Titolo
              </TableCell>
              <TableCell header="true" sx={{ fontWeight: "bold" }}>
                Categoria
              </TableCell>
              <TableCell header="true" sx={{ fontWeight: "bold" }}>
                Dettagli
              </TableCell>
              <TableCell
                header="true"
                sx={{ fontWeight: "bold" }}
                align="right"
              >
                Azioni
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {achievements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ padding: 3 }}>
                  Nessun achievement creato. Aggiungi il primo!
                </TableCell>
              </TableRow>
            ) : (
              achievements.map((achievement, index) => (
                <TableRow key={index} hover>
                  <TableCell
                    sx={{ fontFamily: "monospace", fontSize: "0.9em" }}
                  >
                    {achievement.key || "-"}
                  </TableCell>
                  <TableCell>
                    <div>{achievement.title}</div>
                    <div style={{ fontSize: "0.8em", color: "#666" }}>
                      {achievement.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={categoryLabels[achievement.category]}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.9em" }}>
                    {getDetailsText(achievement)}
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifycontent="flex-end"
                    >
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onEdit(achievement)}
                        title="Modifica"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(achievement.key)}
                        title="Elimina"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          Sei sicuro di voler eliminare questo achievement? L'azione non può
          essere annullata.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
