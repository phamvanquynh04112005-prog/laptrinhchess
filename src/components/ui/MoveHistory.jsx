import React from "react";
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Grid } from "lucide-react"; // Đã thay Chess bằng Grid

const MoveHistory = ({ moves, currentMove }) => {
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      white: moves[i],
      black: moves[i + 1] || null,
    });
  }

  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: "rgba(30, 41, 59, 0.8)",
        backdropFilter: "blur(10px)",
        borderRadius: 2,
        p: 2,
        height: "400px",
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <Grid size={20} style={{ marginRight: 8 }} />
        <Typography variant="h6" color="white">
          Lịch sử nước đi
        </Typography>
      </Box>

      <div style={{ height: "340px", overflowY: "auto" }}>
        <AnimatePresence>
          <List>
            {movePairs.map((pair, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ListItem
                  className="move-history-item"
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor:
                      currentMove === index * 2
                        ? "rgba(59, 130, 246, 0.3)"
                        : "transparent",
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography
                          color="white"
                          fontWeight={
                            currentMove === index * 2 ? "bold" : "normal"
                          }
                        >
                          {index + 1}. {pair.white}
                        </Typography>
                        <Typography
                          color="#94a3b8"
                          fontWeight={
                            currentMove === index * 2 + 1 ? "bold" : "normal"
                          }
                        >
                          {pair.black || ""}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </motion.div>
            ))}
          </List>
        </AnimatePresence>
      </div>
    </Paper>
  );
};

export default MoveHistory;
