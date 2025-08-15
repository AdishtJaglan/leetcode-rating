import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Verification from "./pages/Verification";
import Profile from "./pages/Profile";
import Problems from "./pages/Problems";
import Contests from "./pages/Contests";
import Layout from "./components/Layout";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/verification" element={<Verification />} />

        <Route path="/profile" element={<Layout />}>
          <Route index element={<Profile />} />
          <Route path="problems" element={<Problems />} />
          <Route path="contests" element={<Contests />} />
        </Route>

        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;
