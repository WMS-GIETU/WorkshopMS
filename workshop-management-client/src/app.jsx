import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Intro from './pages/Intro';
import History from './pages/History';
import NewWorkshop from './pages/NewWorkshop';
import ManageTeam from './pages/ManageTeam';
import Attendance from './pages/Attendance';
import Album from './pages/Album';
import AdminLogin from './pages/AdminLogin';
import ClubmemLogin from './pages/ClubmemLogin';
import Register from './pages/Register';
import WorkshopRequests from './pages/WorkshopRequests';
import ApproveRequest from './pages/ApproveRequest';
import RejectRequest from './pages/RejectRequest';
import Workshops from './pages/Workshops'; // New: Import Workshops component
import RequestWorkshop from './pages/RequestWorkshop';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/club-login" element={<ClubmemLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/Intro" element={<Intro />} />
          <Route path="/new-workshop" element={<NewWorkshop />} /> {/* Updated path to match navigation */}
          <Route path="/request-workshop" element={<RequestWorkshop />} />
          <Route path="/history" element={<History />} />
          <Route path="/manageteam" element={<PrivateRoute><ManageTeam /></PrivateRoute>} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/album" element={<Album />} />
          <Route path="/workshop-requests" element={<WorkshopRequests />} />
          <Route path="/approve-request/:requestId" element={<ApproveRequest />} />
          <Route path="/reject-request/:requestId" element={<RejectRequest />} />
          <Route path="/workshops" element={<Workshops />} /> {/* New: Route for listing workshops */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;