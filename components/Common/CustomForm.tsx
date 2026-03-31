"use client";

import React from "react";
import { Box, Stack } from "@mui/material";
import PrimaryButton from "./PrimaryButton";

interface CustomFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function CustomForm({ handleSubmit, children, disabled }: CustomFormProps) {
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: "100%", maxWidth: 480 }}
    >
      <Stack spacing={2} alignItems="center">
        {children}
        <PrimaryButton type="submit" disabled={disabled}>
          Submit
        </PrimaryButton>
      </Stack>
    </Box>
  );
}

export default CustomForm;
