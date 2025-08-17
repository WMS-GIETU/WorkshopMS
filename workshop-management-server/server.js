require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const workshopRequestRoutes = require('./routes/workshopRequests');
const registrationRequestRoutes = require('./routes/registrationRequests');
const workshopRoutes = require('./routes/workshops');
const albumRoutes = require('./routes/album');
const workshopRegistrationRoutes = require('./routes/workshopRegistration');
const attendanceRoutes = require('./routes/attendance');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/workshop-requests', workshopRequestRoutes);
app.use('/api/registration-requests', registrationRequestRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/album', albumRoutes);
app.use('/api/workshop-registrations', workshopRegistrationRoutes);
app.use('/api/attendance', attendanceRoutes);

// Serve frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../workshop-management-client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../workshop-management-client', 'build', 'index.html'));
    });
}

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(5000, () => console.log('Server running on port 5000'));
  })
  .catch(err => console.error(err));