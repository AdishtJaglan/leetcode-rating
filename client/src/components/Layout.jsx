import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-black p-4">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default Layout;
