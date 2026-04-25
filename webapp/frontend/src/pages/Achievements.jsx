import { useEffect, useState } from "react";
import AchievementForm from "../components/AchievementForm";
import AchievementList from "../components/AchievementList";
import { Container, Alert, Box, Button, Stack } from "@mui/material";
import { authFetch } from "../api";

export default function Achievements({ onLogout, cities }) {
  const [achievements, setAchievements] = useState([]);
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
        ? `/api/achievements/${editingAchievement.key}`
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
          : "Achievement creato con successo!"
      );
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
    // Scroll al form
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setEditingAchievement(null);
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Box sx={{ marginBottom: 4 }}>
        <AchievementForm
          achievement={editingAchievement}
          onSubmit={handleSubmit}
          cities={cities}
        />
        {editingAchievement && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
            sx={{ marginBottom: 2 }}
          >
            Annulla modifica
          </Button>
        )}
      </Box>

      {!loading && (
        <AchievementList
          achievements={achievements}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {loading && <div>Caricamento...</div>}
    </Container>
  );
}
