"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Container,
  Box,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import {
  getGamesList,
  getInterestedGamesForUser,
} from "@/services/gameService";
import GameListCard from "./GameListCard";
import useUser from "@/hooks/useUser";
import BottomNav from "@/components/BottomNav/BottomNav";
import UserHeader from "@/components/UserHeader/UserHeader";

type SortOption = "default" | "aToZ" | "zToA" | "numInterested";

const SORT_CYCLE: SortOption[] = ["default", "numInterested", "aToZ", "zToA"];
const SORT_LABELS: Record<SortOption, string> = {
  default: "Sort: # Interested",
  numInterested: "Sort: A → Z",
  aToZ: "Sort: Z → A",
  zToA: "Sort: Default",
};

function GamesList() {
  const [gamesList, setGamesList] = useState<ReturnType<typeof normalizeGame>[]>([]);
  const [interestedGamesForUser, setInterestedGamesForUser] = useState<
    { gameid: number }[]
  >([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [loading, setLoading] = useState(true);
  const { userId } = useUser();

  function normalizeGame(game: Record<string, unknown>) {
    return {
      ...game,
      interested_players:
        Array.isArray(game.interested_players) &&
        game.interested_players[0] !== null
          ? (game.interested_players as string[])
          : [],
    };
  }

  const fetchGamesList = useCallback(async () => {
    const data = await getGamesList();
    if (data) {
      setGamesList(
        data
          .filter(
            (g: Record<string, unknown>) =>
              Array.isArray(g.owner_names) &&
              (g.owner_names as string[]).length > 0
          )
          .map(normalizeGame)
      );
    }
    if (userId) {
      const interested = await getInterestedGamesForUser(userId);
      if (interested) setInterestedGamesForUser(interested);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchGamesList();
  }, [fetchGamesList]);

  // Real-time updates: poll every 30s as a lightweight alternative to WebSockets
  useEffect(() => {
    const interval = setInterval(fetchGamesList, 30_000);
    return () => clearInterval(interval);
  }, [fetchGamesList]);

  const toggleSort = () => {
    const idx = SORT_CYCLE.indexOf(sortOption);
    setSortOption(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = [...gamesList].sort((a: any, b: any) => {
    if (sortOption === "numInterested")
      return b.interested_players.length - a.interested_players.length;
    if (sortOption === "aToZ") return a.name.localeCompare(b.name);
    if (sortOption === "zToA") return b.name.localeCompare(a.name);
    return 0;
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
        <Container maxWidth="md" disableGutters>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            <UserHeader />
            <Button
              variant="outlined"
              size="small"
              startIcon={<SortIcon />}
              onClick={toggleSort}
              sx={{ whiteSpace: "nowrap" }}
            >
              {SORT_LABELS[sortOption]}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Scrollable games list */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2 }}>
        <Container maxWidth="md" disableGutters>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
              <CircularProgress />
            </Box>
          ) : sorted.length > 0 ? (
            sorted.map((game) => (
              <GameListCard
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                key={(game as any).gameid}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                game={game as any}
                userId={userId}
                interestedGames={interestedGamesForUser}
                refreshList={fetchGamesList}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expanded={expandedCard === (game as any).gameid}
                setExpanded={setExpandedCard}
              />
            ))
          ) : (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: "center", mt: 8 }}
            >
              No games found
            </Typography>
          )}
        </Container>
      </Box>

      {/* Bottom nav */}
      <Box sx={{ flexShrink: 0 }}>
        <Container maxWidth="md" disableGutters>
          <BottomNav />
        </Container>
      </Box>
    </Box>
  );
}

export default GamesList;
