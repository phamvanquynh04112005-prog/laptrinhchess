import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import {
  User,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Award,
  Edit3,
  Lock,
  Calendar,
  Globe,
  Activity,
  List,
} from "lucide-react";
import Header from "../components/layout/Header";
import { authAPI, gameAPI, matchmakingAPI } from "../utils/api";

const COUNTRY_FLAGS = {
  VN: "🇻🇳",
  US: "🇺🇸",
  GB: "🇬🇧",
  JP: "🇯🇵",
  KR: "🇰🇷",
  CN: "🇨🇳",
  IN: "🇮🇳",
  DE: "🇩🇪",
  FR: "🇫🇷",
  RU: "🇷🇺",
  BR: "🇧🇷",
  DEFAULT: "🏳️",
};

const getFlag = (country) => {
  if (!country) return COUNTRY_FLAGS.DEFAULT;
  const code = String(country).toUpperCase().slice(0, 2);
  return COUNTRY_FLAGS[code] || COUNTRY_FLAGS.DEFAULT;
};

const STATUS_LABEL = {
  online: { text: "Online", color: "#10b981" },
  offline: { text: "Offline", color: "#94a3b8" },
  playing: { text: "Đang chơi", color: "#2563eb" },
};

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", avatar: "", country: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadData = async () => {
    try {
      const [profileRes, statsRes, historyRes, gamesRes] = await Promise.all([
        authAPI.getProfile(),
        gameAPI.getStats(),
        matchmakingAPI.getRatingHistory(30),
        gameAPI.getCombinedHistory(50),
      ]);
      if (profileRes.success) setProfile(profileRes.profile);
      if (statsRes.success) setStats(statsRes.stats);
      if (historyRes.success) setRatingHistory(historyRes.history || []);
      if (gamesRes.success) setGames(gamesRes.games || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const u = JSON.parse(userData);
      setProfile((p) => p || { ...u, status: "offline" });
    }
    loadData();
  }, []);

  const handleOpenEdit = () => {
    setEditForm({
      username: profile?.username || "",
      avatar: profile?.avatar || "",
      country: profile?.country || "",
    });
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    const res = await authAPI.updateProfile(editForm);
    if (res.success) {
      setProfile(res.profile);
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...u, ...res.profile }));
      setMessage({ type: "success", text: "Đã cập nhật profile." });
      setEditOpen(false);
    } else {
      setMessage({ type: "error", text: res.message || "Cập nhật thất bại." });
    }
  };

  const handleOpenPassword = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordOpen(true);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới ít nhất 6 ký tự." });
      return;
    }
    const res = await authAPI.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );
    if (res.success) {
      setMessage({ type: "success", text: "Đổi mật khẩu thành công." });
      setPasswordOpen(false);
    } else {
      setMessage({ type: "error", text: res.message || "Đổi mật khẩu thất bại." });
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(Number(seconds) / 60);
    const s = Math.round(Number(seconds) % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !profile) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c1929" }}>
        <Header />
        <CircularProgress sx={{ color: "#2563eb" }} />
      </Box>
    );
  }

  const statusInfo = STATUS_LABEL[profile?.status] || STATUS_LABEL.offline;
  const winRate = stats?.total_games > 0 ? ((stats.wins / stats.total_games) * 100).toFixed(1) : 0;
  const chartData = [...(ratingHistory || [])].reverse();
  const maxRating = Math.max(...chartData.map((r) => r.rating_after || 0), 1200);
  const minRating = Math.min(...chartData.map((r) => r.rating_after || 0), 1200);

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg, #0c1929 0%, #132f4c 100%)" }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {message.text && (
          <Alert
            severity={message.type}
            onClose={() => setMessage({ type: "", text: "" })}
            sx={{ mb: 2 }}
          >
            {message.text}
          </Alert>
        )}

        {/* Header: Avatar, username, country, join date, status */}
        <Card sx={{ mb: 2, backgroundColor: "#132f4c", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" flexWrap="wrap" alignItems="center" gap={3}>
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={profile?.avatar}
                  sx={{
                    width: 88,
                    height: 88,
                    bgcolor: "#2563eb",
                    fontSize: "2rem",
                    border: "3px solid rgba(37,99,235,0.5)",
                  }}
                >
                  {!profile?.avatar && profile?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: statusInfo.color,
                    border: "2px solid #132f4c",
                  }}
                />
              </Box>
              <Box flex={1} minWidth={200}>
                <Typography variant="h5" color="white" fontWeight="bold">
                  {profile?.username}
                </Typography>
                <Typography variant="body2" color="#94a3b8">{profile?.email}</Typography>
                <Box display="flex" flexWrap="wrap" alignItems="center" gap={1.5} mt={1}>
                  <Chip
                    icon={<Globe size={14} />}
                    label={profile?.country ? `${getFlag(profile.country)} ${profile.country}` : "Chưa đặt"}
                    size="small"
                    sx={{ backgroundColor: "rgba(37,99,235,0.2)", color: "#94a3b8" }}
                  />
                  <Chip
                    icon={<Calendar size={14} />}
                    label={profile?.created_at ? `Tham gia: ${formatDate(profile.created_at)}` : ""}
                    size="small"
                    sx={{ backgroundColor: "rgba(37,99,235,0.2)", color: "#94a3b8" }}
                  />
                  <Chip
                    icon={<Activity size={14} />}
                    label={statusInfo.text}
                    size="small"
                    sx={{ backgroundColor: statusInfo.color + "30", color: statusInfo.color }}
                  />
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit3 size={16} />}
                  onClick={handleOpenEdit}
                  sx={{ borderColor: "#2563eb", color: "#2563eb" }}
                >
                  Sửa hồ sơ
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Lock size={16} />}
                  onClick={handleOpenPassword}
                  sx={{ borderColor: "#94a3b8", color: "#94a3b8" }}
                >
                  Đổi mật khẩu
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* ELO theo loại */}
        <Card sx={{ mb: 2, backgroundColor: "#132f4c", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle1" color="#2563eb" fontWeight="bold" gutterBottom>
              ELO theo thể loại
            </Typography>
            <Grid container spacing={2}>
              {[
                { key: "classical_rating", label: "Classical" },
                { key: "rapid_rating", label: "Rapid" },
                { key: "blitz_rating", label: "Blitz" },
                { key: "bullet_rating", label: "Bullet" },
              ].map(({ key, label }) => (
                <Grid item xs={6} sm={3} key={key}>
                  <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "rgba(0,0,0,0.2)", textAlign: "center" }}>
                    <Typography variant="caption" color="#94a3b8">{label}</Typography>
                    <Typography variant="h6" color="white" fontWeight="bold">
                      {stats?.[key] ?? 1200}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Biểu đồ ELO (đơn giản) */}
        {chartData.length > 0 && (
          <Card sx={{ mb: 2, backgroundColor: "#132f4c", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="#2563eb" fontWeight="bold" gutterBottom>
                Diễn biến ELO
              </Typography>
              <Box sx={{ height: 120, display: "flex", alignItems: "flex-end", gap: 0.5 }}>
                {chartData.slice(-20).map((r, i) => {
                  const v = r.rating_after || 1200;
                  const pct = ((v - minRating) / (maxRating - minRating || 1)) * 80 + 10;
                  return (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        height: `${pct}%`,
                        minHeight: 4,
                        borderRadius: 0.5,
                        bgcolor: "#2563eb",
                      }}
                      title={`${r.rating_after} - ${r.date}`}
                    />
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Thống kê: Tổng, Thắng, Thua, Hòa, Tỷ lệ, Thời gian TB, Chuỗi thắng */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: "Tổng trận", value: stats?.total_games ?? 0, icon: <List size={20} /> },
            { label: "Thắng", value: stats?.wins ?? 0, color: "#10b981", icon: <Trophy size={20} /> },
            { label: "Thua", value: stats?.losses ?? 0, color: "#ef4444", icon: <Target size={20} /> },
            { label: "Hòa", value: stats?.draws ?? 0, color: "#f59e0b", icon: <TrendingUp size={20} /> },
            { label: "Tỷ lệ thắng", value: `${winRate}%`, icon: <Award size={20} /> },
            { label: "TG trung bình", value: formatTime(stats?.avg_time), icon: <Clock size={20} /> },
            { label: "Chuỗi thắng dài nhất", value: stats?.best_streak ?? 0, icon: <Trophy size={20} /> },
          ].map((item, i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Card sx={{ backgroundColor: "#132f4c", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 2 }}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box display="flex" alignItems="center" gap={0.5} color={item.color || "#94a3b8"}>
                    {item.icon}
                    <Typography variant="caption" color="#94a3b8">{item.label}</Typography>
                  </Box>
                  <Typography variant="h6" color="white" fontWeight="bold">
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Danh sách ván đã chơi */}
        <Card sx={{ backgroundColor: "#132f4c", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" color="#2563eb" fontWeight="bold" gutterBottom>
              Các ván đã chơi
            </Typography>
            {games.length === 0 ? (
              <Typography color="#94a3b8" py={2}>Chưa có ván nào.</Typography>
            ) : (
              <TableContainer component={Paper} sx={{ backgroundColor: "transparent" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>Ngày</TableCell>
                      <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>Đối thủ</TableCell>
                      <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>Kết quả</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {games.slice(0, 20).map((g, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ color: "#e2e8f0" }}>{formatDate(g.created_at)}</TableCell>
                        <TableCell sx={{ color: "#e2e8f0" }}>{g.opponent || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={g.result === "win" ? "Thắng" : g.result === "loss" ? "Thua" : "Hòa"}
                            sx={{
                              bgcolor: g.result === "win" ? "rgba(16,185,129,0.2)" : g.result === "loss" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                              color: g.result === "win" ? "#10b981" : g.result === "loss" ? "#ef4444" : "#f59e0b",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Dialog sửa hồ sơ */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} PaperProps={{ sx: { bgcolor: "#132f4c", borderRadius: 2 } }}>
        <DialogTitle sx={{ color: "#fff" }}>Sửa hồ sơ</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username (không trùng)"
            value={editForm.username}
            onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
            sx={{ mt: 1, "& .MuiOutlinedInput-root": { color: "#fff" }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
          <TextField
            fullWidth
            label="URL ảnh đại diện"
            value={editForm.avatar}
            onChange={(e) => setEditForm((f) => ({ ...f, avatar: e.target.value }))}
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { color: "#fff" }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
          <TextField
            fullWidth
            label="Quốc gia (VD: VN, US)"
            value={editForm.country}
            onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { color: "#fff" }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", p: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: "#94a3b8" }}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveProfile} sx={{ bgcolor: "#2563eb" }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog đổi mật khẩu */}
      <Dialog open={passwordOpen} onClose={() => setPasswordOpen(false)} PaperProps={{ sx: { bgcolor: "#132f4c", borderRadius: 2 } }}>
        <DialogTitle sx={{ color: "#fff" }}>Đổi mật khẩu</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="Mật khẩu hiện tại"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
            sx={{ mt: 1, "& .MuiOutlinedInput-root": { color: "#fff" }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
          <TextField
            fullWidth
            type="password"
            label="Mật khẩu mới"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { color: "#fff" }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
          <TextField
            fullWidth
            type="password"
            label="Xác nhận mật khẩu mới"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { color: "#fff" }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", p: 2 }}>
          <Button onClick={() => setPasswordOpen(false)} sx={{ color: "#94a3b8" }}>Hủy</Button>
          <Button variant="contained" onClick={handleChangePassword} sx={{ bgcolor: "#2563eb" }}>Đổi mật khẩu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
