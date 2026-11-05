"use client";

import { Card, CardContent, Box, Checkbox, Typography } from "@mui/material";

interface BGGGame {
  gameid: string;
  name: string;
  year?: string | null;
}

interface BGGGameCardProps {
  game: BGGGame;
  gamesListForUser: string[];
  handleCardClick: (game: BGGGame) => void;
  checkedGames: { id: string; name: string }[];
}

function BGGGameCard({
  game,
  gamesListForUser,
  handleCardClick,
  checkedGames,
}: BGGGameCardProps) {
  const alreadyAdded = gamesListForUser.includes(game.gameid);
  const isChecked = checkedGames.some((g) => g.id === game.gameid);

  return (
    <Card
      variant="outlined"
      onClick={!alreadyAdded ? () => handleCardClick(game) : undefined}
      sx={{
        mb: 1,
        cursor: alreadyAdded ? "default" : "pointer",
        opacity: alreadyAdded ? 0.5 : 1,
        backgroundColor: alreadyAdded ? "action.disabledBackground" : "background.paper",
        "&:hover": !alreadyAdded ? { boxShadow: 2 } : {},
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Checkbox
            disabled={alreadyAdded}
            checked={isChecked}
            size="small"
            onClick={(event) => event.stopPropagation()}
            onChange={() => handleCardClick(game)}
            inputProps={{ "aria-label": `checkbox for game ${game.name}` }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body1">{game.name}{game.year ? ` (${game.year})` : ""}</Typography>
            {alreadyAdded && <Typography variant="caption" color="text.secondary">Already added by you</Typography>}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default BGGGameCard;
