import React from "react";
import { Box, Container } from "@mui/material";
import Login from "../components/auth/Login";

const LoginPage = () => {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        pt: 8,
      }}
    >
      <Container maxWidth="sm">
        <Login />
      </Container>
    </Box>
  );
};

export default LoginPage;
