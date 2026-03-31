"use client";

import React from "react";
import { Button } from "@mui/material";

interface PrimaryButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}

const PrimaryButton = ({
  children,
  type = "button",
  onClick,
  disabled,
}: PrimaryButtonProps) => {
  return (
    <Button
      variant="contained"
      color="primary"
      type={type}
      onClick={onClick}
      disabled={disabled}
      fullWidth
    >
      {children}
    </Button>
  );
};

export default PrimaryButton;
