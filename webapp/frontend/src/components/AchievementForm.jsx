import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Autocomplete,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Switch,
} from "@mui/material";

function createEmptyForm() {
  return {
    key: "",
    title: "",
    description: "",
    category: "progress",
    threshold: "",
    cities: [],
    province: "",
    event: "",
    title_visible: false,
    description_visible: false,
  };
}

function normalizeAchievementForForm(achievement, cities) {
  if (!achievement) {
    return createEmptyForm();
  }

  const selectedCities = (achievement.cities || [])
    .map((city) => {
      if (typeof city === "object") {
        return city;
      }

      return (cities || []).find((option) => option.id === city) || null;
    })
    .filter(Boolean);

  return {
    key: achievement.ach_key || achievement.key || "",
    title: achievement.title || "",
    description: achievement.description || "",
    category: achievement.category || "progress",
    threshold: achievement.threshold ?? "",
    cities: selectedCities,
    province: achievement.province || "",
    event: achievement.event || "",
    title_visible: achievement.title_visible ?? false,
    description_visible: achievement.description_visible ?? false,
  };
}

export default function AchievementForm({
  achievement = null,
  onSubmit,
  onCancel,
  cities,
}) {
  const [formData, setFormData] = useState(() =>
    normalizeAchievementForForm(achievement, cities),
  );

  useEffect(() => {
    setFormData(normalizeAchievementForForm(achievement, cities));
  }, [achievement, cities]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...createEmptyForm(),
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ paddingTop: 1 }}
      noValidate
    >
      <Stack spacing={2}>
        {!achievement && (
          <TextField
            label="Key"
            name="key"
            value={formData.key}
            onChange={handleChange}
            placeholder="Key"
            fullWidth
            required
          />
        )}

        <TextField
          label="Titolo"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Titolo"
          fullWidth
          required
        />

        <TextField
          label="Descrizione"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descrizione"
          fullWidth
          multiline
          rows={2}
          required
        />

        <FormControl fullWidth>
          <InputLabel>Categoria</InputLabel>
          <Select
            name="category"
            value={formData.category}
            onChange={handleChange}
            label="Categoria"
          >
            <MenuItem value="progress">Progresso</MenuItem>
            <MenuItem value="city">Città</MenuItem>
            <MenuItem value="province">Provincia</MenuItem>
            <MenuItem value="write">Scritto</MenuItem>
          </Select>
        </FormControl>

        {formData.category === "progress" && (
          <TextField
            label="Soglia (numero)"
            name="threshold"
            type="number"
            value={formData.threshold}
            onChange={handleChange}
            placeholder="Soglia"
            fullWidth
            required
          />
        )}

        {formData.category === "city" && (
          <Autocomplete
            multiple
            options={cities || []}
            getOptionLabel={(option) => option.nome}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={formData.cities}
            onChange={(_, newValue) =>
              setFormData((prev) => ({
                ...createEmptyForm(),
                ...prev,
                cities: newValue,
                key: prev.key,
              }))
            }
            renderInput={(params) => (
              <TextField {...params} label="Città" required />
            )}
          />
        )}

        {formData.category === "province" && (
          <TextField
            label="Provincia"
            name="province"
            value={formData.province}
            onChange={handleChange}
            placeholder="Provincia"
            fullWidth
            required
          />
        )}

        {formData.category === "write" && (
          <TextField
            label="Evento"
            name="event"
            value={formData.event}
            onChange={handleChange}
            placeholder="Evento"
            fullWidth
            required
          />
        )}

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={formData.title_visible}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    title_visible: e.target.checked,
                  }))
                }
              />
            }
            label="Titolo visibile"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.description_visible}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description_visible: e.target.checked,
                  }))
                }
              />
            }
            label="Descrizione visibile"
          />
        </FormGroup>

        <DialogActions sx={{ px: 0, pt: 1 }}>
          <Button onClick={onCancel} color="inherit">
            Annulla
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
          >
            {achievement ? "Salva modifiche" : "Aggiungi achievement"}
          </Button>
        </DialogActions>
      </Stack>
    </Box>
  );
}
