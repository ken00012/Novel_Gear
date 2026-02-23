import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/Layout/DashboardLayout";
import CharacterList from "./pages/Characters/CharacterList";
import CharacterDetail from "./pages/Characters/CharacterDetail";
import StatusDashboard from "./pages/Status/StatusDashboard";
import PlotDashboard from "./pages/Plot/PlotDashboard";
import BoardDashboard from "./pages/Board/BoardDashboard";
import LibraryDashboard from "./pages/Library/LibraryDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/characters" replace />} />
          <Route path="plot" element={<PlotDashboard />} />
          <Route path="characters" element={<CharacterList />} />
          <Route path="characters/:id" element={<CharacterDetail />} />
          <Route path="status" element={<StatusDashboard />} />
          <Route path="library" element={<LibraryDashboard />} />
          <Route path="board" element={<BoardDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
