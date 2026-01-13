import React from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import { motion } from "framer-motion";
import { Crown, Shield, AlertCircle, Trophy } from "lucide-react";

const GameStatus = ({ game, turn }) => {
  const getStatusMessage = () => {
    if (game.isCheckmate()) {
      return {
        message: "CHIẾU HẾT!",
        color: "#ef4444",
        icon: <Trophy size={20} />,
        bgColor: "rgba(239, 68, 68, 0.1)",
      };
    }
    if (game.isCheck()) {
      return {
        message: "CHIẾU TƯỚNG!",
        color: "#f59e0b",
        icon: <AlertCircle size={20} />,
        bgColor: "rgba(245, 158, 11, 0.1)",
      };
    }
    if (game.isDraw()) {
      return {
        message: "HÒA",
        color: "#94a3b8",
        icon: <Shield size={20} />,
        bgColor: "rgba(148, 163, 184, 0.1)",
      };
    }
    return {
      message: "ĐANG CHƠI",
      color: "#10b981",
      icon: <Crown size={20} />,
      bgColor: "rgba(16, 185, 129, 0.1)",
    };
  };

  const status = getStatusMessage();

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={6}
        sx={{
          backgroundColor: status.bgColor,
          backdropFilter: "blur(10px)",
          borderRadius: 2,
          p: 3,
          border: `1px solid ${status.color}20`,
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center">
            {status.icon}
            <Typography
              variant="h5"
              sx={{
                ml: 1,
                fontWeight: "bold",
                color: status.color,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {status.message}
            </Typography>
          </Box>

          <Chip
            label={`Lượt: ${turn === "w" ? "TRẮNG" : "ĐEN"}`}
            sx={{
              backgroundColor: turn === "w" ? "white" : "#1e293b",
              color: turn === "w" ? "black" : "white",
              fontWeight: "bold",
            }}
          />
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="#cbd5e1">
            FEN:
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "monospace",
              backgroundColor: "rgba(0,0,0,0.3)",
              p: 1,
              borderRadius: 1,
              color: "#94a3b8",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {game.getFen()}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default GameStatus;
