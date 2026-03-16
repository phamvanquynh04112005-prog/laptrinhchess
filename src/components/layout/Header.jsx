import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Avatar,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Cpu,
  Users,
  Crown,
  Menu as MenuIcon,
  LogOut,
  User,
  LogIn,
  UserPlus,
  BookOpen,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const navItems = [
    { label: "Trang chủ", path: "/", icon: <Home size={20} /> },
    { label: "Chơi AI", path: "/play", icon: <Cpu size={20} /> },
    { label: "2 Người", path: "/multiplayer", icon: <Users size={20} /> },
    { label: "Online", path: "/online", icon: <Users size={20} /> },
    { label: "Khai cuộc", path: "/learning/openings", icon: <BookOpen size={20} /> },
    { label: "Tàn cuộc", path: "/learning/endgames", icon: <Trophy size={20} /> },
  ];

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    handleUserMenuClose();
    navigate("/");
  };

  const handleProfile = () => {
    handleUserMenuClose();
    navigate("/profile");
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)",
        borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
        transition: "all 0.3s ease",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  position: "relative",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: -5,
                    left: -5,
                    right: -5,
                    bottom: -5,
                    background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                    borderRadius: "50%",
                    filter: "blur(8px)",
                    opacity: 0.6,
                    zIndex: -1,
                  },
                }}
              >
                <Crown size={32} color="#2563eb" />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#2563eb",
                  letterSpacing: "-0.3px",
                }}
              >
                ChessMaster
              </Typography>
            </Box>
          </motion.div>

          {/* Navigation - Desktop */}
          {!isMobile && (
            <Box display="flex" gap={1} alignItems="center">
              {navItems.map((item) => (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      color:
                        location.pathname === item.path ? "#3b82f6" : "#cbd5e1",
                      textTransform: "none",
                      fontSize: "1rem",
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          location.pathname === item.path
                            ? "linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.1))"
                            : "transparent",
                        borderRadius: 2,
                        zIndex: -1,
                      },
                      "&:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        color: "#3b82f6",
                        "&::before": {
                          background:
                            "linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.15))",
                        },
                      },
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {item.label}
                    {location.pathname === item.path && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "60%",
                          height: 3,
                          background:
                            "linear-gradient(90deg, #3b82f6, #60a5fa)",
                          borderRadius: "2px 2px 0 0",
                        }}
                      />
                    )}
                  </Button>
                </motion.div>
              ))}

              {/* User Menu or Auth Buttons */}
              {user ? (
                <>
                  <IconButton
                    onClick={handleUserMenuOpen}
                    sx={{
                      ml: 2,
                      border: "2px solid #2563eb",
                      "&:hover": {
                        backgroundColor: "rgba(37, 99, 235, 0.1)",
                      },
                    }}
                  >
                    <Avatar
                      src={user.avatar}
                      sx={{
                        bgcolor: "#2563eb",
                        width: 36,
                        height: 36,
                        fontSize: "1rem",
                      }}
                    >
                      {user.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    PaperProps={{
                      sx: {
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        borderRadius: 2,
                        minWidth: 200,
                        mt: 1,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        color="white"
                        fontWeight="bold"
                      >
                        {user.username}
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        {user.email}
                      </Typography>
                      <Box display="flex" gap={2} mt={1}>
                        <Typography variant="caption" color="#3b82f6">
                          ELO: {user.rating}
                        </Typography>
                        <Typography variant="caption" color="#10b981">
                          Thắng: {user.gamesWon || 0}
                        </Typography>
                      </Box>
                    </Box>
                    <MenuItem
                      onClick={handleProfile}
                      sx={{
                        color: "#cbd5e1",
                        py: 1.5,
                        "&:hover": {
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                        },
                      }}
                    >
                      <User size={18} style={{ marginRight: 8 }} />
                      Hồ sơ
                    </MenuItem>
                    <MenuItem
                      onClick={handleLogout}
                      sx={{
                        color: "#ef4444",
                        py: 1.5,
                        "&:hover": {
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                        },
                      }}
                    >
                      <LogOut size={18} style={{ marginRight: 8 }} />
                      Đăng xuất
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box display="flex" gap={1} ml={2}>
                  <Button
                    component={Link}
                    to="/login"
                    startIcon={<LogIn size={18} />}
                    variant="outlined"
                    sx={{
                      borderColor: "#3b82f6",
                      color: "#3b82f6",
                      "&:hover": {
                        borderColor: "#2563eb",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                      },
                    }}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    startIcon={<UserPlus size={18} />}
                    variant="contained"
                    sx={{
                      background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                      "&:hover": {
                        background: "linear-gradient(90deg, #2563eb, #4f46e5)",
                      },
                    }}
                  >
                    Đăng ký
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Mobile Menu */}
          {isMobile && (
            <>
              <Box display="flex" alignItems="center" gap={1}>
                {user && (
                  <IconButton
                    onClick={handleUserMenuOpen}
                    sx={{
                      border: "2px solid #3b82f6",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "#3b82f6",
                        width: 32,
                        height: 32,
                        fontSize: "0.9rem",
                      }}
                    >
                      {user.username[0].toUpperCase()}
                    </Avatar>
                  </IconButton>
                )}
                <IconButton
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMenuOpen}
                  sx={{
                    color: "#cbd5e1",
                    "&:hover": {
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    borderRadius: 2,
                    minWidth: 200,
                  },
                }}
              >
                {navItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      color:
                        location.pathname === item.path ? "#3b82f6" : "#cbd5e1",
                      backgroundColor:
                        location.pathname === item.path
                          ? "rgba(59, 130, 246, 0.1)"
                          : "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        color: "#3b82f6",
                      },
                      py: 1.5,
                      px: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {item.icon}
                    <Typography variant="body1">{item.label}</Typography>
                  </MenuItem>
                ))}
                {!user && (
                  <>
                    <MenuItem
                      onClick={() => handleNavigate("/login")}
                      sx={{
                        color: "#3b82f6",
                        py: 1.5,
                        px: 3,
                        "&:hover": {
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                        },
                      }}
                    >
                      <LogIn size={18} style={{ marginRight: 12 }} />
                      Đăng nhập
                    </MenuItem>
                    <MenuItem
                      onClick={() => handleNavigate("/register")}
                      sx={{
                        color: "#10b981",
                        py: 1.5,
                        px: 3,
                        "&:hover": {
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                        },
                      }}
                    >
                      <UserPlus size={18} style={{ marginRight: 12 }} />
                      Đăng ký
                    </MenuItem>
                  </>
                )}
              </Menu>

              {/* Mobile User Menu */}
              {user && (
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  PaperProps={{
                    sx: {
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      borderRadius: 2,
                      minWidth: 200,
                    },
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="white"
                      fontWeight="bold"
                    >
                      {user.username}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8">
                      {user.email}
                    </Typography>
                  </Box>
                  <MenuItem
                    onClick={handleProfile}
                    sx={{
                      color: "#cbd5e1",
                      py: 1.5,
                      "&:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                      },
                    }}
                  >
                    <User size={18} style={{ marginRight: 8 }} />
                    Hồ sơ
                  </MenuItem>
                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      color: "#ef4444",
                      py: 1.5,
                      "&:hover": {
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                      },
                    }}
                  >
                    <LogOut size={18} style={{ marginRight: 8 }} />
                    Đăng xuất
                  </MenuItem>
                </Menu>
              )}
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
