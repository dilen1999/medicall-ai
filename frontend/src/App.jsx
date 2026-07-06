import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Calls from "./pages/Calls";
import HandoffQueue from "./pages/HandoffQueue";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/customers", label: "Customers" },
  { to: "/orders", label: "Orders" },
  { to: "/calls", label: "Calls" },
  { to: "/handoff-queue", label: "Handoff Queue" },
];

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>MediCall AI</h1>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/handoff-queue" element={<HandoffQueue />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
