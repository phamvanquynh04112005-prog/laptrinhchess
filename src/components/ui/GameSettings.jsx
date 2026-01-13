// src/components/ui/GameSettings.jsx
import React from "react";
import {
  Box,
  Typography,
  Slider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Button,
  Switch,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import {
  Settings,
  Zap,
  Target,
  Brain,
  Clock,
  Moon,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion } from "framer-motion";

const GameSettings = ({
  difficulty,
  setDifficulty,
  timeControl,
  setTimeControl,
  gameStarted,
  soundEnabled = true,
  setSoundEnabled,
  darkMode = true,
  setDarkMode,
  boardTheme = "classic",
  setBoardTheme,
}) => {
  const timeControls = [
    { value: 0, label: "Không giới hạn" },
    { value: 60, label: "1 phút" },
    { value: 180, label: "3 phút" },
    { value: 300, label: "5 phút" },
    { value: 600, label: "10 phút" },
    { value: 1800, label: "30 phút" },
  ];

  const boardThemes = [
    { value: "classic", label: "Cổ điển", colors: ["#f0d9b5", "#b58863"] },
    { value: "blue", label: "Xanh dương", colors: ["#e2e8f0", "#475569"] },
    { value: "green", label: "Xanh lá", colors: ["#d1fae5", "#10b981"] },
    { value: "purple", label: "Tím", colors: ["#ede9fe", "#8b5cf6"] },
  ];

  const formatTime = (seconds) => {
    if (seconds === 0) return "∞";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <Card
      sx={{
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              mb: 2,
            }}
          >
            <Settings size={28} color="#fff" />
          </Box>
          <Typography variant="h5" fontWeight="bold" color="white">
            Cài Đặt Game
          </Typography>
          <Typography variant="body2" color="#94a3b8">
            Tùy chỉnh trải nghiệm chơi cờ của bạn
          </Typography>
        </Box>

        {/* Difficulty Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Box sx={{ mb: 4 }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel
                component="legend"
                sx={{
                  color: "#3b82f6",
                  fontWeight: 600,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Target size={18} />
                Độ khó AI
              </FormLabel>
              <RadioGroup
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={gameStarted}
              >
                {[
                  {
                    value: "easy",
                    label: "Dễ",
                    desc: "Phù hợp cho người mới bắt đầu",
                    icon: <Zap size={16} color="#10b981" />,
                    color: "#10b981",
                  },
                  {
                    value: "medium",
                    label: "Trung bình",
                    desc: "Thách thức vừa phải",
                    icon: <Target size={16} color="#3b82f6" />,
                    color: "#3b82f6",
                  },
                  {
                    value: "hard",
                    label: "Khó",
                    desc: "Dành cho chuyên gia",
                    icon: <Brain size={16} color="#ef4444" />,
                    color: "#ef4444",
                  },
                ].map((option) => (
                  <motion.div
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FormControlLabel
                      value={option.value}
                      control={
                        <Radio
                          sx={{
                            color: option.color,
                            "&.Mui-checked": {
                              color: option.color,
                            },
                          }}
                        />
                      }
                      label={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor:
                              difficulty === option.value
                                ? `${option.color}15`
                                : "rgba(255,255,255,0.05)",
                            border: `1px solid ${
                              difficulty === option.value
                                ? `${option.color}30`
                                : "rgba(255,255,255,0.1)"
                            }`,
                            transition: "all 0.3s",
                          }}
                        >
                          {option.icon}
                          <Box>
                            <Typography
                              sx={{
                                color: "white",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {option.label}
                              {difficulty === option.value && (
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    backgroundColor: option.color,
                                  }}
                                />
                              )}
                            </Typography>
                            <Typography variant="caption" color="#94a3b8">
                              {option.desc}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ mb: 1.5, ml: 0, width: "100%" }}
                    />
                  </motion.div>
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        </motion.div>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />

        {/* Time Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Box sx={{ mb: 4 }}>
            <FormLabel
              component="legend"
              sx={{
                color: "#3b82f6",
                fontWeight: 600,
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Clock size={18} />
              Thời gian mỗi bên
            </FormLabel>

            <Box sx={{ px: 2 }}>
              <Slider
                value={timeControl}
                onChange={(e, value) => setTimeControl(value)}
                disabled={gameStarted}
                min={0}
                max={1800}
                step={60}
                marks={timeControls.map((t) => ({
                  value: t.value,
                  label: (
                    <Typography
                      variant="caption"
                      sx={{
                        color: timeControl === t.value ? "#3b82f6" : "#94a3b8",
                        fontWeight: timeControl === t.value ? 600 : 400,
                      }}
                    >
                      {t.label}
                    </Typography>
                  ),
                }))}
                valueLabelDisplay="auto"
                valueLabelFormat={formatTime}
                sx={{
                  color: "#3b82f6",
                  height: 8,
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#3b82f6",
                    width: 20,
                    height: 20,
                    "&:hover, &.Mui-focusVisible": {
                      boxShadow: "0 0 0 8px rgba(59, 130, 246, 0.16)",
                    },
                    "&.Mui-active": {
                      boxShadow: "0 0 0 12px rgba(59, 130, 246, 0.3)",
                    },
                  },
                  "& .MuiSlider-track": {
                    backgroundColor: "#3b82f6",
                    height: 6,
                  },
                  "& .MuiSlider-rail": {
                    backgroundColor: "#334155",
                    height: 6,
                  },
                  "& .MuiSlider-mark": {
                    backgroundColor: "#64748b",
                    height: 12,
                    width: 2,
                  },
                  "& .MuiSlider-markActive": {
                    backgroundColor: "#3b82f6",
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="#94a3b8">
                Thời gian hiện tại:
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "#3b82f6",
                  fontWeight: 700,
                  mt: 0.5,
                  fontFamily: "monospace",
                }}
              >
                {formatTime(timeControl)}
              </Typography>
            </Box>
          </Box>
        </motion.div>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />

        {/* Additional Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Stack spacing={3}>
            {/* Sound Toggle */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {soundEnabled ? (
                  <Volume2 size={20} color="#3b82f6" />
                ) : (
                  <VolumeX size={20} color="#94a3b8" />
                )}
                <Box>
                  <Typography color="white" fontWeight={500}>
                    Âm thanh
                  </Typography>
                  <Typography variant="caption" color="#94a3b8">
                    Bật/tắt hiệu ứng âm thanh
                  </Typography>
                </Box>
              </Box>
              <Switch
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#3b82f6",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#3b82f6",
                  },
                }}
              />
            </Box>

            {/* Dark Mode Toggle */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {darkMode ? (
                  <Moon size={20} color="#3b82f6" />
                ) : (
                  <Sun size={20} color="#fbbf24" />
                )}
                <Box>
                  <Typography color="white" fontWeight={500}>
                    Chế độ tối
                  </Typography>
                  <Typography variant="caption" color="#94a3b8">
                    Bật/tắt giao diện tối
                  </Typography>
                </Box>
              </Box>
              <Switch
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#3b82f6",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#3b82f6",
                  },
                }}
              />
            </Box>

            {/* Board Theme Selector */}
            <Box>
              <Typography
                color="white"
                fontWeight={600}
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                🎨 Giao diện bàn cờ
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                {boardThemes.map((themeOption) => (
                  <motion.div
                    key={themeOption.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setBoardTheme(themeOption.value)}
                      sx={{
                        p: 2,
                        minWidth: 100,
                        borderRadius: 2,
                        backgroundColor:
                          boardTheme === themeOption.value
                            ? "rgba(59, 130, 246, 0.2)"
                            : "rgba(255,255,255,0.05)",
                        border: `2px solid ${
                          boardTheme === themeOption.value
                            ? "#3b82f6"
                            : "rgba(255,255,255,0.1)"
                        }`,
                        "&:hover": {
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        {/* Mini Board Preview */}
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {[0, 1].map((i) => (
                            <Box
                              key={i}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              {[0, 1].map((j) => (
                                <Box
                                  key={j}
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    backgroundColor:
                                      (i + j) % 2 === 0
                                        ? themeOption.colors[0]
                                        : themeOption.colors[1],
                                    borderRadius: 1,
                                  }}
                                />
                              ))}
                            </Box>
                          ))}
                        </Box>
                        <Typography
                          variant="caption"
                          color={
                            boardTheme === themeOption.value
                              ? "#3b82f6"
                              : "#94a3b8"
                          }
                          fontWeight={
                            boardTheme === themeOption.value ? 600 : 400
                          }
                        >
                          {themeOption.label}
                        </Typography>
                      </Box>
                    </Button>
                  </motion.div>
                ))}
              </Stack>
            </Box>
          </Stack>
        </motion.div>

        {/* Reset Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: 32 }}
        >
          <Button
            fullWidth
            variant="outlined"
            sx={{
              py: 1.5,
              borderColor: "rgba(255,255,255,0.2)",
              color: "#94a3b8",
              "&:hover": {
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
              },
            }}
            onClick={() => {
              setDifficulty("medium");
              setTimeControl(600);
              setSoundEnabled(true);
              setBoardTheme("classic");
            }}
          >
            Đặt lại mặc định
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default GameSettings;
