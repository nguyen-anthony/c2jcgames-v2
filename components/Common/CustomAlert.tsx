"use client";

import React from "react";
import { Alert } from "@mui/material";

interface CustomAlertProps {
  severity: "success" | "error" | "info" | "warning" | "";
  message: string;
}

const CustomAlert = ({ severity, message }: CustomAlertProps) => {
  if (!message || !severity) return null;
  return <Alert severity={severity}>{message}</Alert>;
};

export default CustomAlert;
