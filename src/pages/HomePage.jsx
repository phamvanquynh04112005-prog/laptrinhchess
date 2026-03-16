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
  ArrowRight,
  BookOpen,
  Trophy,
  Zap,
  Target,
  Award,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";

const HomePage = () => {
  const mainFeatures = [
    {
      icon: <Users size={36} />,
      title: "Chơi Online",
      description: "Tìm đối thủ và thi đấu xếp hạng",
      color: "#2563eb",
      path: "/online",
    },
    {
      icon: <Cpu size={36} />,
      title: "Chơi với AI",
      description: "Đấu với AI nhiều cấp độ",
      color: "#2563eb",
      path: "/play",
    },
    {
      icon: <Users size={36} />,
      title: "Hai Người",
      description: "Chơi cùng bạn trên cùng máy",
      color: "#1d4ed8",
      path: "/multiplayer",
    },
  ];

  const learningFeatures = [
    {
      icon: <BookOpen size={28} />,
      title: "Khai cuộc",
      description: "Học và luyện tập các khai cuộc",
      color: "#2563eb",
      path: "/learning/openings",
    },
    {
      icon: <Trophy size={28} />,
      title: "Tàn cuộc",
      description: "Làm chủ các thế tàn cuộc",
      color: "#1d4ed8",
      path: "/learning/endgames",
    },
  ];

  const stats = [
    { label: "Cấp độ AI", value: "3", icon: <Zap size={20} /> },
    { label: "Chế độ", value: "4", icon: <Target size={20} /> },
    { label: "Khai cuộc", value: "50+", icon: <BookOpen size={20} /> },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0c1929 0%, #132f4c 50%, #0f172a 100%)",
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />

      <Container
        maxWidth="xl"
        sx={{ position: "relative", zIndex: 1, pt: 12, pb: 8 }}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "2rem", md: "2.75rem" },
                color: "#2563eb",
                letterSpacing: "-0.02em",
              }}
            >
              ChessMaster
            </Typography>

            <Typography
              variant="body1"
              color="#94a3b8"
              sx={{
                mb: 3,
                maxWidth: "560px",
                mx: "auto",
                fontSize: { xs: "0.95rem", md: "1.05rem" },
              }}
            >
              Chơi với AI, hai người hoặc online. Học khai cuộc và tàn cuộc.
            </Typography>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                component={Link}
                to="/play"
                variant="contained"
                size="medium"
                endIcon={<ArrowRight size={18} />}
                sx={{
                  backgroundColor: "#2563eb",
                  fontSize: "1rem",
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  "&:hover": { backgroundColor: "#1d4ed8" },
                }}
              >
                Bắt đầu chơi
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        {/* Stats Section */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
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

        {/* Main Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Typography variant="h5" color="#2563eb" textAlign="center" mb={3} fontWeight="bold">
            Chế độ chơi
          </Typography>

          <Grid container spacing={4} sx={{ mb: 8 }}>
            {mainFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.6 }}
                  whileHover={{ y: -10 }}
                >
                  <Card
                    component={Link}
                    to={feature.path}
                    sx={{
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 3,
                      height: "100%",
                      border: `1px solid ${feature.color}20`,
                      textDecoration: "none",
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
                        endIcon={<ArrowRight size={16} />}
                        sx={{
                          color: feature.color,
                          mt: 2,
                          "&:hover": { backgroundColor: `${feature.color}10` },
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

        {/* Learning Features Section - NEW */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Box textAlign="center" mb={4}>
            <Typography variant="h5" color="#2563eb" textAlign="center" mb={1} fontWeight="bold">
              Học tập
            </Typography>
            <Typography variant="body2" color="#94a3b8" textAlign="center">
              Khai cuộc và tàn cuộc
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 6 }}>
            {learningFeatures.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 1 }}
                  whileHover={{ y: -10 }}
                >
                  <Card
                    component={Link}
                    to={feature.path}
                    sx={{
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 3,
                      height: "100%",
                      border: `2px solid ${feature.color}40`,
                      textDecoration: "none",
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.3s",
                      "&:hover": {
                        border: `2px solid ${feature.color}`,
                        boxShadow: `0 20px 60px ${feature.color}40`,
                        transform: "translateY(-10px)",
                      },
                    }}
                  >
                    {feature.badge && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          backgroundColor: feature.color,
                          color: "white",
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        {feature.badge}
                      </Box>
                    )}

                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${feature.color}40 0%, ${feature.color}20 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 3,
                        }}
                      >
                        <Box sx={{ color: feature.color }}>{feature.icon}</Box>
                      </Box>

                      <Typography
                        variant="h5"
                        color="white"
                        gutterBottom
                        fontWeight="bold"
                      >
                        {feature.title}
                      </Typography>

                      <Typography
                        variant="body1"
                        color="#94a3b8"
                        paragraph
                        sx={{ mb: 3 }}
                      >
                        {feature.description}
                      </Typography>

                      <Button
                        fullWidth
                        variant="outlined"
                        endIcon={<ArrowRight size={18} />}
                        sx={{
                          borderColor: feature.color,
                          color: feature.color,
                          fontWeight: "bold",
                          "&:hover": {
                            borderColor: feature.color,
                            backgroundColor: `${feature.color}15`,
                          },
                        }}
                      >
                        Bắt đầu học
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
          transition={{ delay: 1.2 }}
        >
          <Box
            sx={{
              backgroundColor: "rgba(37, 99, 235, 0.08)",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              position: "relative",
            }}
          >

            <Award size={48} style={{ color: "#2563eb", marginBottom: 16 }} />

            <Typography variant="h5" color="white" gutterBottom fontWeight="bold">
              Bắt đầu chơi
            </Typography>
            <Typography variant="body2" color="#94a3b8" sx={{ mb: 3, maxWidth: "480px", mx: "auto" }}>
              Chơi với AI, hai người hoặc tìm đối thủ online.
            </Typography>
            <Button
              component={Link}
              to="/play"
              variant="contained"
              size="medium"
              startIcon={<Play size={18} />}
              sx={{
                backgroundColor: "#2563eb",
                px: 3,
                py: 1.25,
                "&:hover": { backgroundColor: "#1d4ed8" },
              }}
            >
              Chơi ngay
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default HomePage;
