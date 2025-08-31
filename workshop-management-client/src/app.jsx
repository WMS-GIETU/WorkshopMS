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
import UnifiedRegister from './pages/UnifiedRegister';
import AdminClubRegister from './pages/AdminClubRegister';
import WorkshopRequests from './pages/WorkshopRequests';
import ApproveRequest from './pages/ApproveRequest';
import RejectRequest from './pages/RejectRequest';
import Workshops from './pages/Workshops'; // New: Import Workshops component
import About from './pages/About';
import RequestWorkshop from './pages/RequestWorkshop';
import PrivateRoute from './components/PrivateRoute';


// Student-specific imports
import StudentRegister from './pages/StudentRegister';
import StudentLogin from './pages/StudentLogin';
import StudentLayout from './components/StudentLayout';
import StudentWelcome from './pages/StudentWelcome';
import StudentMyWorkshops from './pages/StudentMyWorkshops';
import StudentMyProfile from './pages/StudentMyProfile';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/club-login" element={<ClubmemLogin />} />
          <Route path="/register" element={<UnifiedRegister />} />
          <Route path="/register/admin-club" element={<AdminClubRegister />} />
          <Route path="/register/student" element={<StudentRegister />} />
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
          <Route path="/about" element={<About />} />
          

          {/* Student Routes */}
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-dashboard" element={<PrivateRoute requiredRoles={['student']}><StudentLayout /></PrivateRoute>}>
            <Route index element={<StudentWelcome />} />
            <Route path="my-workshops" element={<StudentMyWorkshops />} />
            <Route path="my-profile" element={<StudentMyProfile />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;