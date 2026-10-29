"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  IconButton,
  Typography,
  Collapse,
  CardContent,
  Button,
  Box,
  Chip,
} from "@mui/material";
import { updateInterestedGameForUser } from "@/services/gameService";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ThumbUpAltRounded from "@mui/icons-material/ThumbUpAltRounded";
import ThumbUpOffAlt from "@mui/icons-material/ThumbUpOffAlt";
import GroupsIcon from "@mui/icons-material/Groups";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

interface Game {
  gameid: number;
  name: string;
  imageurl: string;
  minplayers: number;
  maxplayers: number;
  playtime: number;
  description: string;
  owner_names: string[];
  interested_players: string[];
}

interface GameListCardProps {
  game: Game;
  userId: string | null;
  interestedGames: { gameid: number }[];
  refreshList: () => void;
  expanded: boolean;
  setExpanded: (id: number | null) => void;
}

const capitalizeName = (input: string) =>
  input
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

function GameListCard({
  game,
  userId,
  interestedGames,
  refreshList,
  expanded,
  setExpanded,
}: GameListCardProps) {
  const [liked, setLiked] = useState(
    () =>
      interestedGames?.some((g) => g.gameid === game.gameid) ?? false
  );
  const [showFullDescription, setShowFullDescription] = useState(false);

  const words = game.description.split(" ");
  const shortDescription =
    words.slice(0, 30).join(" ") + (words.length > 30 ? "..." : "");
  const displayDescription = showFullDescription
    ? game.description
    : shortDescription;

  const handleLikeClick = async () => {
    if (!userId) return;
    try {
      await updateInterestedGameForUser(userId, game.gameid, liked ? "remove" : "add");
      setLiked((prev) => !prev);
      refreshList();
    } catch (error) {
      console.error(error);
    }
  };

  const handleExpandClick = () => {
    setExpanded(expanded ? null : game.gameid);
  };

  const playerRange =
    game.minplayers === game.maxplayers
      ? `${game.maxplayers}`
      : `${game.minplayers}–${game.maxplayers}`;

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        mb: 1,
        borderRadius: 2,
        "&:hover": { boxShadow: 2 },
      }}
    >
      <CardHeader
        avatar={
          game.imageurl && !expanded ? (
            <Box
              component="img"
              src={game.imageurl}
              alt={`${game.name} thumbnail`}
              sx={{
                width: 56,
                height: 56,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          ) : null
        }
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              gap: 1,
            }}
            onClick={handleExpandClick}
          >
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ flex: 1, lineHeight: 1.3 }}
            >
              {game.name}
            </Typography>
            <ExpandMoreIcon
              fontSize="large"
              sx={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                flexShrink: 0,
                color: "text.secondary",
              }}
            />
          </Box>
        }
        subheader={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            <GroupsIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {playerRange} players
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>
              ·
            </Typography>
            <AccessTimeIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {game.playtime} min
            </Typography>
          </Box>
        }
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pt: 0.5 }}>
            {game.interested_players.length > 0 && (
              <Chip
                label={`${game.interested_players.length} interested`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
              <IconButton
                onClick={handleLikeClick}
                aria-label="interested to play"
              size="large"
              color={liked ? "primary" : "default"}
              disabled={!userId}
              sx={{ minWidth: 48, minHeight: 48 }}
            >
              {liked ? (
                <ThumbUpAltRounded sx={{ fontSize: 30 }} />
              ) : (
                <ThumbUpOffAlt sx={{ fontSize: 30 }} />
              )}
            </IconButton>
          </Box>
        }
        sx={{ pb: 0, alignItems: "flex-start" }}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent
          sx={{
            px: 2,
            pt: 1.5,
            pb: 2,
            maxHeight: { xs: "55dvh", sm: "none" },
            overflowY: { xs: "auto", sm: "visible" },
            "&:last-child": { pb: 2 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              mb: 2,
            }}
          >
            {game.imageurl && (
              <Box
                component="img"
                src={game.imageurl}
                alt={game.name}
                sx={{
                  width: { xs: "100%", sm: 120 },
                  height: { xs: "auto", sm: 120 },
                  objectFit: "cover",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Owners:</strong>{" "}
                {game.owner_names.map(capitalizeName).join(", ")}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Players:</strong> {playerRange}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Play time:</strong> {game.playtime} min
              </Typography>
              {game.interested_players.length > 0 && (
                <Typography variant="body2" gutterBottom>
                  <strong>Interested ({game.interested_players.length}):</strong>{" "}
                  {game.interested_players.map(capitalizeName).join(", ")}
                </Typography>
              )}
              <Typography variant="body2">
                <Button
                  size="small"
                  variant="text"
                  href={`https://boardgamegeek.com/boardgame/${game.gameid}`}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ px: 0, textTransform: "none" }}
                >
                  View on BGG ↗
                </Button>
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            <span
              dangerouslySetInnerHTML={{
                __html: displayDescription.replace(/&#10;/g, "<br />"),
              }}
            />
          </Typography>
          {words.length > 30 && (
            <Button
              size="small"
              onClick={() => setShowFullDescription((p) => !p)}
              sx={{ mt: 0.5, px: 0, textTransform: "none" }}
            >
              {showFullDescription ? "See less..." : "See more..."}
            </Button>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}

export default GameListCard;
