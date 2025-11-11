// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Grading from './pages/Grading';
import User from './pages/users/User';
import Layout from './pages/Layout';
import Faculty from './pages/faculties/Faculty';
import Major from './pages/majors/Major';
import Semester from './pages/semesters/Semester';
import Subject from './pages/subjects/Subjects';
import Class from './pages/classes/Class';
import Assignment from './pages/assignment/AssignmentList';
import ClassList from './pages/classes/ClassList';
import AssignmentDetail from './pages/assignment/AssignmentDetail';
import ClassDetail from './pages/classes/CLassDetail';
import ClassStudent from './pages/classStudent/ClassStudent';
import AssignmentList from './studentPages/assignmentList/AssignmentList';
import AssignmentDetails from './studentPages/assignmentList/AssignmentDetails';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />

        {/* Routes protected, có Sidebar */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/grading" element={<Grading />} />
          <Route path="/admin/user_list" element={<User />} />
          <Route path="/admin/faculty_list" element={<Faculty />} />
          <Route path="/admin/major_list" element={<Major />} />
          <Route path="/admin/semester_list" element={<Semester />} />
          <Route path="/admin/subject_list" element={<Subject />} />
          <Route path="/admin/class_list" element={<Class />} />
          <Route path="/admin/class_list_by_teacher" element={<ClassList />} />
          <Route path="/admin/class_detail/:classId" element={<ClassDetail />} />
          <Route path="/admin/assignment-list/:classId" element={<Assignment />} />
          <Route path="/admin/assignment-detail/:assignmentId" element={<AssignmentDetail />} />
          <Route path='/admin/student_by_class/:classId' element={<ClassStudent />} />
          {/* /assignment-details/${item.id} */}
          <Route path='/assignment-list/:classId' element={<AssignmentList />} />
          <Route path='/assignment-details/:assignmentId' element={<AssignmentDetails />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
