// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
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
import ClassDetail from './pages/classes/ClassDetail'; // SỬA TÊN FILE: CLassDetail -> ClassDetail
import ClassStudent from './pages/classStudent/ClassStudent';
import AssignmentList from './studentPages/assignmentList/AssignmentList';
import AssignmentDetails from './studentPages/assignmentList/AssignmentDetails';
import SubmissionDetail from './pages/assignment/SubmissionDetail';
import Chapters from './studentPages/materials/Chapters';
import ChapterDetail from './studentPages/materials/ChapterDetail';
import TeacherChapters from './pages/materials/Chapters';
import TeacherChapterDetail from './pages/materials/ChapterDetail';
import LessonDetail from './studentPages/materials/LessonDetail';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Quizzes from './pages/quizzes/Quizzes';
import CreateQuiz from './pages/quizzes/CreateQuiz';
import StudentQuizzes from './studentPages/studentQuizzes/StudentQuizzes';
import StudentQuizDetail from './studentPages/studentQuizzes/StudentQuizDetail';
import QuizResultPage from './studentPages/studentQuizzes/QuizResultPage';
import GradeComponent from './pages/gradeComponent/GradeComponent';
import GradeRule from './pages/gradeRule/GradeRule';
import Grade from './pages/grade/Grade';
import QuizManagement from './pages/quizzes/QuizManagment';
import QuizResult from './pages/quizzes/QuizResult';
import ChatPage from './pages/chat/ChatPage';
import Statistic from './pages/statistic/Statistic';
import Profile from './pages/profile/Profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />

        {/* Routes protected, có Sidebar */}
        <Route element={<Layout />}>
          <Route path="/admin_dashboard" element={<AdminDashboard />} />
          <Route path="/teacher_dashboard" element={<TeacherDashboard />} />
          <Route path="/student_dashboard" element={<StudentDashboard />} />
          <Route path="/admin/grades/:classId" element={<Grade />} />
          <Route path="/admin/user_list" element={<User />} />
          <Route path="/admin/faculty_list" element={<Faculty />} />
          <Route path="/admin/major_list" element={<Major />} />
          <Route path="/admin/semester_list" element={<Semester />} />
          <Route path="/admin/subject_list" element={<Subject />} />
          <Route path="/admin/class_list" element={<Class />} />
          <Route path="/admin/grade_component_list" element={<GradeComponent />} />
          <Route path="/admin/grade_rule_list" element={<GradeRule />} />
          <Route path='/admin/statistic' element={<Statistic />} />
          <Route path="/admin/class_list_by_teacher" element={<ClassList />} />
          <Route path="/admin/class_detail/:classId" element={<ClassDetail />} />
          <Route path="/admin/assignment-list/:classId" element={<Assignment />} />
          <Route path="/admin/assignment-detail/:assignmentId" element={<AssignmentDetail />} />
          <Route path='/admin/student_by_class/:classId' element={<ClassStudent />} />
          <Route path='/admin/submission_detail/:submissionId/:studentId' element={<SubmissionDetail />} />
          <Route path='/admin/chapters/:classId' element={<TeacherChapters />} />
          <Route path='/admin/chapter_details/:chapterId' element={<TeacherChapterDetail />} />
          <Route path='/admin/quizzes/:classId' element={<Quizzes />} />
          <Route path='/admin/quiz-managment/:quizId' element={<QuizManagement />} />
          <Route path='/admin/quiz_results/:quizId' element={<QuizResult />} />
          <Route path='/admin/create-quiz/:quizId' element={<CreateQuiz />} />

          <Route path='/chat/:classId' element={<ChatPage />} />
          <Route path='/profile' element={<Profile />} />
          {/* Student Routes - GIỮ NGUYÊN */}
          <Route path='/assignment-list/:classId' element={<AssignmentList />} />
          <Route path='/assignment-details/:assignmentId' element={<AssignmentDetails />} />
          <Route path='/chapters/:classId' element={<Chapters />} />
          <Route path='/chapter_details/:chapterId' element={<ChapterDetail />} />
          <Route path='/lesson/:lessonId' element={<LessonDetail />} />
          <Route path='/quizzes/:classId' element={<StudentQuizzes />} />
          <Route path='/quiz-detail/:quizId' element={<StudentQuizDetail />} />
          <Route path="/quiz-result/:quizId" element={<QuizResultPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;