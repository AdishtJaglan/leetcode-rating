import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Verification from "./pages/Verification";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;
