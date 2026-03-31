"use client";

import { TextField } from "@mui/material";

interface BGGUrlFormProps {
  gameURL: string;
  setGameURL: (url: string) => void;
}

function BGGUrlForm({ gameURL, setGameURL }: BGGUrlFormProps) {
  return (
    <TextField
      label="BGG Game URL"
      placeholder="https://boardgamegeek.com/boardgame/12345/game-name"
      variant="outlined"
      fullWidth
      value={gameURL}
      onChange={(e) => setGameURL(e.target.value)}
      required
      size="small"
      helperText="Paste the full BGG URL for the game you want to add"
    />
  );
}

export default BGGUrlForm;
