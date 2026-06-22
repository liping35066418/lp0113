import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Branches from "@/pages/Branches";
import Permissions from "@/pages/Permissions";
import Publish from "@/pages/Publish";
import Logs from "@/pages/Logs";
import Simulator from "@/pages/Simulator";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/simulator" element={<Simulator />} />
        </Route>
      </Routes>
    </Router>
  );
}
