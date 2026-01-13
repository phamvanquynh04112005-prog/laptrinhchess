import React from "react";
import {
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  Cpu,
  Users,
  Puzzle,
  BarChart,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Grid as GridIcon, // Đổi tên để tránh trùng với component Grid của MUI
  Crown,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";

const HomePage = () => {
  const features = [
    {
      icon: <Cpu size={40} />,
      title: "Chơi với AI",
      description: "Đấu với trí tuệ nhân tạo nhiều cấp độ",
      color: "#3b82f6",
      path: "/play",
    },
    {
      icon: <Users size={40} />,
      title: "Hai Người",
      description: "Chơi cùng bạn bè trên cùng máy",
      color: "#10b981",
      path: "/multiplayer",
    },
    {
      icon: <Puzzle size={40} />,
      title: "Câu Đố Cờ",
      description: "Rèn luyện kỹ năng với thế cờ thách thức",
      color: "#f59e0b",
      path: "/puzzles",
    },
    {
      icon: <BarChart size={40} />,
      title: "Phân Tích",
      description: "Phân tích ván cờ và cải thiện chiến thuật",
      color: "#8b5cf6",
      path: "/analysis",
    },
  ];

  const stats = [
    { label: "Cấp độ AI", value: "10+", icon: <Zap size={24} /> },
    { label: "Thế cờ", value: "1000+", icon: <Target size={24} /> },
    { label: "Thời gian thực", value: "Có", icon: <Clock size={24} /> },
    {
      label: "Người dùng",
      value: "Đang phát triển",
      icon: <TrendingUp size={24} />,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />

      <Header />

      <Container
        maxWidth="xl"
        sx={{ position: "relative", zIndex: 1, mt: 8, pb: 8 }}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box textAlign="center" mb={8}>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              mb={3}
            >
              <Sparkles style={{ color: "#fbbf24", marginRight: 16 }} />
              <Typography
                variant="h1"
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
                }}
              >
                ChessMaster Pro
              </Typography>
              <Sparkles style={{ color: "#fbbf24", marginLeft: 16 }} />
            </Box>

            <Typography
              variant="h5"
              color="#cbd5e1"
              sx={{
                mb: 4,
                maxWidth: "800px",
                mx: "auto",
                fontSize: { xs: "1.1rem", md: "1.5rem" },
              }}
            >
              Nền tảng cờ vua toàn diện với AI thông minh, đa dạng chế độ chơi
              và công cụ phân tích chuyên sâu
            </Typography>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                component={Link}
                to="/play"
                variant="contained"
                size="large"
                endIcon={<ArrowRight />}
                sx={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
                  fontSize: "1.2rem",
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)",
                    boxShadow: "0 15px 40px rgba(59, 130, 246, 0.6)",
                  },
                }}
              >
                Bắt đầu chơi ngay
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Grid container spacing={3} sx={{ mb: 8 }}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card
                    sx={{
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      border: "1px solid rgba(255,255,255,0.1)",
                      height: "100%",
                    }}
                  >
                    <Box sx={{ color: "#3b82f6", mb: 2 }}>{stat.icon}</Box>
                    <Typography
                      variant="h3"
                      color="white"
                      fontWeight="bold"
                      gutterBottom
                    >
                      {stat.value}
                    </Typography>
                    <Typography color="#cbd5e1" variant="subtitle1">
                      {stat.label}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Typography
            variant="h3"
            color="white"
            textAlign="center"
            mb={4}
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(90deg, #10b981 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Tính Năng Nổi Bật
          </Typography>

          <Grid container spacing={4} sx={{ mb: 8 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.6 }}
                  whileHover={{ y: -10 }}
                >
                  <Card
                    sx={{
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 3,
                      height: "100%",
                      border: `1px solid ${feature.color}20`,
                      transition: "all 0.3s",
                      cursor: "pointer",
                      "&:hover": {
                        border: `1px solid ${feature.color}`,
                        boxShadow: `0 20px 40px ${feature.color}30`,
                        transform: "translateY(-10px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: "center" }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${feature.color}30 0%, ${feature.color}10 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          mb: 3,
                        }}
                      >
                        <Box sx={{ color: feature.color }}>{feature.icon}</Box>
                      </Box>

                      <Typography
                        variant="h5"
                        color="white"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        {feature.title}
                      </Typography>

                      <Typography variant="body2" color="#94a3b8" paragraph>
                        {feature.description}
                      </Typography>

                      <Button
                        component={Link}
                        to={feature.path}
                        endIcon={<ArrowRight size={16} />}
                        sx={{
                          color: feature.color,
                          mt: 2,
                          "&:hover": {
                            backgroundColor: `${feature.color}10`,
                          },
                        }}
                      >
                        Khám phá
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Box
            sx={{
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderRadius: 3,
              p: 6,
              textAlign: "center",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 70%)",
              }}
            />

            <GridIcon
              size={64}
              style={{ color: "#3b82f6", marginBottom: 24 }}
            />

            <Typography
              variant="h3"
              color="white"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              Sẵn sàng thách đấu?
            </Typography>

            <Typography
              variant="h6"
              color="#cbd5e1"
              paragraph
              sx={{ mb: 4, maxWidth: "600px", mx: "auto" }}
            >
              Tham gia ngay để trải nghiệm cờ vua ở cấp độ mới. Hoàn toàn miễn
              phí!
            </Typography>

            <Box display="flex" justifyContent="center" gap={3} flexWrap="wrap">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  component={Link}
                  to="/play"
                  variant="contained"
                  size="large"
                  startIcon={<GridIcon />}
                  sx={{
                    background:
                      "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Bắt đầu chơi
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  component={Link}
                  to="/puzzles"
                  variant="outlined"
                  size="large"
                  startIcon={<Puzzle />}
                  sx={{
                    borderColor: "#10b981",
                    color: "#10b981",
                    px: 4,
                    py: 1.5,
                    "&:hover": {
                      borderColor: "#10b981",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                    },
                  }}
                >
                  Thử câu đố
                </Button>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default HomePage;
