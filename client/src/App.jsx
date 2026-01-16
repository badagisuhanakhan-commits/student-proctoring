import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import Login from "./components/Login";
import StudentCamera from "./components/StudentCamera";
import FacultyDashboard from "./components/FacultyDashboard";

function AppRoutes() {
  const { user } = useUser();

  // If no user, show login page
  if (!user) return <Login />;

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user.role === "faculty" ? "/faculty" : "/student"} />}
      />
      <Route path="/student" element={<StudentCamera />} />
      <Route path="/faculty" element={<FacultyDashboard />} />
      {/* Optional: catch all redirect */}
      <Route path="*" element={<Navigate to={user.role === "faculty" ? "/faculty" : "/student"} />} />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  );
}

export default App;
