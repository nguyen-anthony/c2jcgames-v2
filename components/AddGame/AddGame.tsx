"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Stack,
  CircularProgress,
} from "@mui/material";
import CustomAlert from "@/components/Common/CustomAlert";
import PrimaryButton from "@/components/Common/PrimaryButton";
import BGGUrlForm from "./BGGUrlForm";
import BGGGameCard from "./BGGGameCard";
import BottomNav from "@/components/BottomNav/BottomNav";
import UserHeader from "@/components/UserHeader/UserHeader";
import useUser from "@/hooks/useUser";
import {
  addGameDetailsToDb,
  addGameToDb,
  getGameDetailsFromBGG,
  getGameDetailsFromDb,
  getOwnedGamesCollection,
  getOwnedGamesInGamesTable,
} from "@/services/gameService";

type AlertInfo = {
  message: string;
  severity: "success" | "error" | "info" | "warning" | "";
};

interface BGGGame {
  gameid: string;
  name: string;
}

export default function AddGame() {
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    message: "",
    severity: "",
  });
  const [tabValue, setTabValue] = useState(0);
  const [gameURL, setGameURL] = useState("");
  const [gameCollection, setGameCollection] = useState<BGGGame[]>([]);
  const [gamesListForUser, setGamesListForUser] = useState<string[]>([]);
  const [checkedGames, setCheckedGames] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { userId, isBggUser } = useUser();

  useEffect(() => {
    if (isBggUser) {
      getOwnedGamesCollection(userId!).then((c) => {
        if (c) setGameCollection(c);
      });
    }

    if (userId) {
      getOwnedGamesInGamesTable(userId).then((owned) => {
        if (owned) setGamesListForUser(owned);
      });
    }
  }, [userId, isBggUser]);

  const extractGameId = useCallback((url: string) => {
    const match = url.match(/boardgame\/(\d+)/);
    return match ? match[1] : null;
  }, []);

  const fetchGamesListForUser = useCallback(async () => {
    if (!userId) return;
    const owned = await getOwnedGamesInGamesTable(userId);
    if (owned) setGamesListForUser(owned);
  }, [userId]);

  const handleNonBGGSubmit = useCallback(async () => {
    const gameId = extractGameId(gameURL);
    if (!gameId) {
      setAlertInfo({ message: "Invalid BGG URL", severity: "error" });
      return;
    }
    if (gamesListForUser.includes(gameId)) {
      setAlertInfo({ message: "You already added this game", severity: "error" });
      return;
    }
    let inDb = (await getGameDetailsFromDb(gameId)) !== null;
    if (!inDb) {
      const bggRes = await getGameDetailsFromBGG(gameId);
                if (bggRes.success && bggRes.data) {
                  const addRes = await addGameDetailsToDb(bggRes.data);
        inDb = addRes.success;
        if (inDb) setGameURL("");
      } else {
        setAlertInfo({
          message: "Unable to get game details from BGG",
          severity: "error",
        });
        return;
      }
    }
    if (inDb) {
      const addRes = await addGameToDb(gameId, userId!);
      setAlertInfo({
        message: addRes.message,
        severity: addRes.success ? "success" : "error",
      });
      if (addRes.success) fetchGamesListForUser();
    }
  }, [extractGameId, gameURL, gamesListForUser, userId, fetchGamesListForUser]);

  const processGameChunks = useCallback(
    async (chunks: { id: string; name: string }[][]) => {
      const failed: { id: string; name: string }[] = [];
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (game) => {
            try {
              let inDb = (await getGameDetailsFromDb(game.id)) !== null;
              if (!inDb) {
                const bggRes = await getGameDetailsFromBGG(game.id);
      if (bggRes.success && bggRes.data) {
        const addRes = await addGameDetailsToDb(bggRes.data);
                  inDb = addRes.success;
                } else {
                  failed.push(game);
                  return;
                }
              }
              if (inDb) {
                const addRes = await addGameToDb(game.id, userId!);
                if (!addRes.success) failed.push(game);
              }
            } catch (e) {
              console.error(`Error processing gameID ${game.id}:`, e);
              failed.push(game);
            }
          })
        );
      }
      return failed;
    },
    [userId]
  );

  const handleBGGImportSubmit = useCallback(async () => {
    const CHUNK_SIZE = 5;
    const chunks: { id: string; name: string }[][] = [];
    for (let i = 0; i < checkedGames.length; i += CHUNK_SIZE) {
      chunks.push(checkedGames.slice(i, i + CHUNK_SIZE));
    }
    const failed = await processGameChunks(chunks);
    fetchGamesListForUser();
    if (failed.length > 0) {
      setAlertInfo({
        message: `Failed to add: ${failed.map((g) => `${g.name} (ID: ${g.id})`).join(", ")}`,
        severity: "error",
      });
      setCheckedGames(failed);
    } else {
      setAlertInfo({ message: "All games processed successfully.", severity: "success" });
      setCheckedGames([]);
    }
  }, [checkedGames, processGameChunks, fetchGamesListForUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo({ message: "Processing request...", severity: "info" });
    setLoading(true);
    await (tabValue === 0 ? handleNonBGGSubmit() : handleBGGImportSubmit());
    setLoading(false);
  };

  const handleCardClick = (game: BGGGame) => {
    setCheckedGames((prev) =>
      prev.find((g) => g.id === game.gameid)
        ? prev.filter((g) => g.id !== game.gameid)
        : [...prev, { id: game.gameid, name: game.name }]
    );
  };

  const bggImportDisabled =
    !isBggUser || gameCollection.length === gamesListForUser.length;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
        <Container maxWidth="md" disableGutters>
          <UserHeader />
        </Container>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, px: 2, pb: 2 }}>
        <Container maxWidth="sm" disableGutters>
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Add by BGG URL" />
              <Tab label="Import from BGG" />
            </Tabs>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ p: { xs: 2, sm: 3 } }}
            >
              <Stack spacing={2}>
                {tabValue === 0 && (
                  <BGGUrlForm gameURL={gameURL} setGameURL={setGameURL} />
                )}

                {tabValue === 1 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {!isBggUser
                        ? "No BGG account linked. Sign in with your BGG username to import."
                        : gameCollection.length === gamesListForUser.length
                        ? "All your BGG games have already been added."
                        : `Select games to import (${checkedGames.length} selected)`}
                    </Typography>
                    <Box>
                      {gameCollection.map((game) => (
                        <BGGGameCard
                          key={game.gameid}
                          game={game}
                          gamesListForUser={gamesListForUser}
                          handleCardClick={handleCardClick}
                          checkedGames={checkedGames}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <PrimaryButton
                  type="submit"
                  disabled={
                    loading ||
                    (tabValue === 1 && bggImportDisabled) ||
                    (tabValue === 1 && checkedGames.length === 0)
                  }
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Submit"
                  )}
                </PrimaryButton>

                {alertInfo.message && (
                  <CustomAlert
                    severity={alertInfo.severity}
                    message={alertInfo.message}
                  />
                )}
              </Stack>
            </Box>
          </Paper>
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
