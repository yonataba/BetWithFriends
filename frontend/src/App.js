import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import CreateGroupPage from "./pages/CreateGroupPage";
import BetDetailPage from "./pages/BetDetailPage";
import CreateBetPage from "./pages/CreateBetPage";
import NicknameSetupPage from "./pages/NicknameSetupPage";
import CurrencyManagePage from "./pages/CurrencyManagePage";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.nickname) return <Navigate to="/setup/nickname" replace />;
  return children;
}

function SuperuserRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup/nickname" element={<NicknameSetupPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <PrivateRoute>
                  <GroupsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/groups/new"
              element={
                <PrivateRoute>
                  <CreateGroupPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <PrivateRoute>
                  <GroupDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/groups/:groupId/bets/new"
              element={
                <PrivateRoute>
                  <CreateBetPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/groups/:groupId/bets/:betId"
              element={
                <PrivateRoute>
                  <BetDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/currencies"
              element={
                <SuperuserRoute>
                  <CurrencyManagePage />
                </SuperuserRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
