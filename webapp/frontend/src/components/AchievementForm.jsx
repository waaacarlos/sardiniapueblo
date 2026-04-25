import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Autocomplete,
} from "@mui/material";

export default function AchievementForm({ achievement = null, onSubmit, cities }) {
  const [formData, setFormData] = useState(
    achievement || {
      key: "",
      title: "",
      description: "",
      category: "progress",
      threshold: "",
      cities: [],
      province: "",
      event: "",
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card sx={{ padding: 3, marginBottom: 3 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {!achievement && (
            <TextField
              label="Key"
              name="key"
              value={formData.key}
              onChange={handleChange}
              placeholder="Key"
              fullWidth
              disabled={!!achievement}
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
              <MenuItem value="city_province">Città e Provincia</MenuItem>
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
              value={formData.cities}
              onChange={ (_, newValue) => setFormData((prev) => ({ ...prev, cities: newValue }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Città"
                />
              )}
            />

            // <TextField
            //   label="Città (una per riga)"
            //   name="cities"
            //   value={formData.cities}
            //   onChange={handleChange}
            //   placeholder="Città"
            //   fullWidth
            //   multiline
            //   rows={3}
            //   required
            // />
          )}

          {formData.category === "city_province" && (
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

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
          >
            {achievement ? "Modifica" : "Aggiungi"} Achievement
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}
