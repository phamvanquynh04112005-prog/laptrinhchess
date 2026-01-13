import React from "react";
import { Box, Container } from "@mui/material";
import Register from "../components/auth/Register";

const RegisterPage = () => {
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
        <Register />
      </Container>
    </Box>
  );
};

export default RegisterPage;
