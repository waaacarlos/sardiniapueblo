import { useEffect, useState } from "react";
import { API_URI } from "../api";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Icon,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function Login({ onLogin, onExit }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const generateOTP = () => {
    fetch(API_URI + "/api/generateotp", {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          setError("Failed to generate OTP. Please try again.");
          return;
        }
        return response.json();
      })
  }
  
  const handleLogin = () => {
    fetch(API_URI + "/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    })
      .then((response) => {
        if (!response.ok) {
          setError(response.status == 401 ? "Password sbagliata." : response.status == 400 ? "OTP non generato." : "Login failed. Please try again.");
          return;
        }
        return response.json();
      })
      .then((data) => {
        if (!data) return;
        if (data && data.token) {
          localStorage.setItem("token", data.token);
          onLogin();
        }
      })
      .catch((error) => {
        console.error("Error during login:", error);
        setError("An error occurred. Please try again.");
      });
  };

  return (
    <>
      <Dialog open sx={{ minWidth: 275 }}>
        <DialogTitle>Admin section</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={onExit}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <TextField
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            error={!!error}
            label={error}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="white" onClick={generateOTP}>
            OTP
          </Button>
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Login
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
