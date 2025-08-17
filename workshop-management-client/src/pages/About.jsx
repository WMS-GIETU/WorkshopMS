// About.jsx
import React from 'react';
import './About.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = () => {
  return (
    <>
      <Header />
      <div className="about-container main-with-header-footer">
        <header className="about-header">
          <h1>About the Project</h1>
        </header>

        <section className="project-synopsis">
          <h2>Synopsis for Minor Project-I</h2>

          <h3>Title Of Project: Workshop Management System</h3>

          <h3>1. Introduction:</h3>
          <p>
            In educational institutions, student clubs often organize workshops to enhance learning and engagement. 
            Managing these workshops manually can be tedious, error-prone, and inefficient. This project proposes 
            the development of a Workshop Management System (WMS) — a centralized, digital platform for 
            organizing and monitoring workshops conducted by multiple clubs within a university.
          </p>

          <h3>2. Objective:</h3>
          <p>
            To design and implement a user-friendly web-based system that simplifies:
          </p>
          <ul>
            <li>Club team structuring</li>
            <li>Workshop creation and management</li>
            <li>Participant tracking</li>
            <li>Attendance recording</li>
            <li>Media storage and retrieval</li>
          </ul>

          <h3>3. Technologies Used:</h3>
          <table>
            <thead>
              <tr>
                <th>Layer</th>
                <th>Tools & Frameworks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Frontend</td>
                <td>HTML, CSS, JavaScript, React.js</td>
              </tr>
              <tr>
                <td>Backend</td>
                <td>Node.js, Express.js</td>
              </tr>
              <tr>
                <td>Database</td>
                <td>MongoDB Atlas</td>
              </tr>
              <tr>
                <td>Tools</td>
                <td>Git, VS Code</td>
              </tr>
            </tbody>
          </table>

          <h3>4. System Modules:</h3>
          <ul>
            <li>
              <strong>I. Club Management:</strong>
              <ul>
                <li>Add/edit club team members (President, VP, Coordinators)</li>
                <li>Assign roles and responsibilities</li>
              </ul>
            </li>
            <li>
              <strong>II. Workshop Management:</strong>
              <ul>
                <li>Create new workshops with details (title, date, topic, location)</li>
                <li>Maintain history for future reference</li>
              </ul>
            </li>
            <li>
              <strong>III. Participant Handling:</strong>
              <ul>
                <li>Register students for workshops</li>
                <li>Store participant data for attendance and certification</li>
              </ul>
            </li>
            <li>
              <strong>IV. Attendance Tracking:</strong>
              <ul>
                <li>Mark and store attendance per workshop</li>
                <li>Retrieve and export data when needed</li>
              </ul>
            </li>
            <li>
              <strong>V. Media Gallery:</strong>
              <ul>
                <li>Upload and manage photos/videos of past workshops</li>
                <li>Organize by club and event</li>
              </ul>
            </li>
          </ul>

          <h3>5. Database Design (MongoDB Collections):</h3>
          <ul>
            <li>clubs – Club name, description, members</li>
            <li>workshops – Workshop details, linked to a club</li>
            <li>participants – Registered users for each workshop</li>
            <li>attendance – Attendance status per participant per event</li>
            <li>media – Image/video URLs linked to workshops</li>
          </ul>

          <h3>6. Testing and Validation:</h3>
          <ul>
            <li>APIs tested using Postman</li>
            <li>Functional testing for form submissions</li>
          </ul>

          <h3>7. Expected Outcome:</h3>
          <ul>
            <li>A fully functional web application</li>
            <li>Centralized management of workshops</li>
            <li>Accurate tracking of participation and attendance</li>
            <li>Organized digital archive of workshop media</li>
          </ul>

          <h3>8. Scope for Future Enhancement:</h3>
          <ul>
            <li>Login and authentication system</li>
            <li>Automated certificate generation</li>
            <li>Email/SMS notification system for event reminders</li>
            <li>Admin dashboard with analytics and reports</li>
          </ul>

          <h3>9. Conclusion:</h3>
          <p>
            This Workshop Management System enhances the efficiency of organizing and maintaining workshop-
            related data for university clubs. It reduces manual workload, ensures data consistency, and provides a 
            scalable digital solution for academic events.
          </p>
        </section>

        <section className="developers-section">
          <h2>Developers</h2>
          <p>This project was developed by:</p>
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Regd No</th>
                <th>Name of the Student</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>23CSE094</td>
                <td>23UG010179</td>
                <td>Moningi Vinay Kumar</td>
              </tr>
              <tr>
                <td>23CSE051</td>
                <td>23UG010136</td>
                <td>Soumyaranjan Rath</td>
              </tr>
              <tr>
                <td>23CSE046</td>
                <td>23UG010131</td>
                <td>Anamu Yashwant</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="supervisor-section">
          <h2>Supervision</h2>
          <p>
            <strong>Group No:</strong> (Not specified)<br />
            <strong>Name of the Supervisor:</strong> Mr. Santosh Kumar Panda<br />
            <strong>Name of the Class Teacher:</strong> Mr. Tirupati Sahu
          </p>
        </section>

      </div>
      <Footer />
    </>
  );
};

export default About;