import { useEffect, useState } from "react";
import AchievementForm from "../components/AchievementForm";
import AchievementList from "../components/AchievementList";
import {
  Container,
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Fab,
  Divider,
  Paper,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { authFetch } from "../api";

export default function Achievements({ cities }) {
  const [achievements, setAchievements] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Carica gli achievements al mount
  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = () => {
    setLoading(true);
    setError(null);
    authFetch("/api/achievements")
      .then((response) => {
        if (!response.ok) throw new Error("Errore nel caricamento");
        return response.json();
      })
      .then((data) => {
        setAchievements(data);
        setLoading(false);
      })
      .catch((error) => {
        setError("Errore nel caricamento degli achievements");
        setLoading(false);
        console.error("Error fetching achievements:", error);
      });
  };

  const handleSubmit = async (formData) => {
    try {
      setError(null);
      const method = editingAchievement ? "PUT" : "POST";
      const url = editingAchievement
        ? `/api/achievements/${editingAchievement.ach_key}`
        : "/api/achievements";

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nell'operazione");
      }

      setSuccessMessage(
        editingAchievement
          ? "Achievement modificato con successo!"
          : "Achievement creato con successo!",
      );
      setIsFormOpen(false);
      setEditingAchievement(null);
      loadAchievements();

      // Nascondi il messaggio dopo 3 secondi
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error.message || "Errore nell'operazione");
      console.error("Error:", error);
    }
  };

  const handleEdit = (achievement) => {
    setEditingAchievement(achievement);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingAchievement(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (key) => {
    try {
      setError(null);
      const response = await authFetch(`/api/achievements/${key}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nell'eliminazione");
      }

      setSuccessMessage("Achievement eliminato con successo!");
      loadAchievements();

      // Nascondi il messaggio dopo 3 secondi
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error.message || "Errore nell'eliminazione");
      console.error("Error:", error);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingAchievement(null);
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Box sx={{ marginBottom: 3 }}>
        <Grid container>
          <Grid size="grow">
            <Box component="h1" sx={{ m: 0, fontSize: "1.75rem" }}>
              Obiettivi
            </Box>
          </Grid>
          <Grid>
            <Fab size="small" color="primary" aria-label="add" onClick={handleCreate}>
              <AddIcon />
            </Fab>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ marginBottom: 2 }}>
          {successMessage}
        </Alert>
      )}

      {!loading && (
        <AchievementList
          achievements={achievements}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {loading && <div>Caricamento...</div>}

      <Dialog open={isFormOpen} onClose={handleCancel} fullWidth maxWidth="md">
        <DialogTitle>
          {editingAchievement ? "Modifica achievement" : "Nuovo achievement"}
        </DialogTitle>
        <DialogContent>
          <AchievementForm
            achievement={editingAchievement}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            cities={cities}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
}
