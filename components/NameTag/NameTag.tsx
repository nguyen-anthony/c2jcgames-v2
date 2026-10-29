"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  TextField,
  Box,
  Stack,
  Paper,
} from "@mui/material";
import {
  addUser,
  getUser,
  getBggUserDetails,
  getBggGamesForUser,
  updateBggUserGames,
} from "@/services/userService";
import { getOwnedGamesCollection } from "@/services/gameService";
import useUser from "@/hooks/useUser";
import CustomAlert from "@/components/Common/CustomAlert";
import PrimaryButton from "@/components/Common/PrimaryButton";

type AlertInfo = {
  message: string;
  severity: "success" | "error" | "info" | "warning" | "";
};

type LoginStep = "username" | "name";

export default function NameTag() {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [step, setStep] = useState<LoginStep>("username");
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    message: "",
    severity: "",
  });
  const router = useRouter();
  const { setUser, clearUser } = useUser();

  useEffect(() => {
    clearUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateHome = (
    userId: string | number,
    first: string,
    last: string,
    bggacc: string | null
  ) => {
    setUser(userId, first, last, bggacc);
    router.push("/");
  };

  const handleUsernameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) return;

    setLoading(true);
    setAlertInfo({ message: "Checking username...", severity: "info" });
    try {
      const existingUser = await getUser(normalizedUsername);

      if (existingUser) {
        if (existingUser.bggacc) {
          const ownedGames = await getOwnedGamesCollection(existingUser.userid);
          const bggCollection = await getBggGamesForUser(existingUser.bggacc);
          if (
            bggCollection &&
            ownedGames?.length !== bggCollection.length &&
            bggCollection.length !== 0
          ) {
            await updateBggUserGames(existingUser.bggacc, bggCollection);
          }
        }

        navigateHome(
          existingUser.userid,
          existingUser.firstname,
          existingUser.lastname,
          existingUser.bggacc
        );
        return;
      }

      const bggDetails = await getBggUserDetails(normalizedUsername);
      if (bggDetails.success) {
        const gamesForUser = await getBggGamesForUser(normalizedUsername);
        const userId = await addUser(
          normalizedUsername,
          bggDetails.firstName || normalizedUsername,
          bggDetails.lastName || "",
          normalizedUsername,
          gamesForUser
        );
        if (!userId) {
          setAlertInfo({ message: "Could not create your account. Please try again.", severity: "error" });
          return;
        }
        navigateHome(
          userId,
          bggDetails.firstName || normalizedUsername,
          bggDetails.lastName || "",
          normalizedUsername
        );
      } else if (bggDetails.notFound) {
        setStep("name");
        setAlertInfo({
          message: "We couldn't find that username on BoardGameGeek. Add your name to finish creating your account.",
          severity: "info",
        });
      } else {
        setAlertInfo({ message: bggDetails.message ?? "Unable to check BoardGameGeek. Please try again.", severity: "error" });
      }
    } catch (error) {
      console.error("Error signing in:", error);
      setAlertInfo({ message: "Unable to sign in. Please try again.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setLoading(true);
    try {
      const userId = await addUser(username, firstName, lastName, "");
      if (!userId) {
        setAlertInfo({ message: "Could not create your account. That username may already be in use.", severity: "error" });
        return;
      }
      navigateHome(userId, firstName.trim(), lastName.trim(), null);
    } catch (error) {
      console.error("Error creating user:", error);
      setAlertInfo({ message: "Could not create your account. That username may already be in use.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{ p: { xs: 3, sm: 4 }, width: "100%", borderRadius: 3 }}
      >
        <Stack spacing={3} alignItems="center">
          <Typography variant="h4" fontWeight={700} textAlign="center">
            C2JC Games
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Sign in to see who&apos;s interested in playing what
          </Typography>

          <Box
            component="form"
            onSubmit={step === "username" ? handleUsernameSubmit : handleNameSubmit}
            sx={{ width: "100%" }}
          >
            <Stack spacing={2}>
              {step === "username" ? (
                <>
                  <TextField
                    label="Username"
                    variant="outlined"
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    size="small"
                    autoComplete="username"
                    autoFocus
                    required
                  />
                  <Typography variant="body2" color="text.secondary">
                    Use your BoardGameGeek username if you have one, else your desired username
                  </Typography>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Checking..." : "Continue"}
                  </PrimaryButton>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Username: <strong>{username.trim()}</strong>
                  </Typography>
                  <TextField
                    label="First Name"
                    variant="outlined"
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    size="small"
                    autoComplete="given-name"
                    autoFocus
                    required
                  />
                  <TextField
                    label="Last Name"
                    variant="outlined"
                    fullWidth
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    size="small"
                    autoComplete="family-name"
                    required
                  />
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      setStep("username");
                      setAlertInfo({ message: "", severity: "" });
                    }}
                    disabled={loading}
                  >
                    Back
                  </PrimaryButton>
                </>
              )}

              {alertInfo.message && (
                <CustomAlert
                  severity={alertInfo.severity}
                  message={alertInfo.message}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
