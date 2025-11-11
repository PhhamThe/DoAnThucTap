// components/Assignments.js
import React, { useState } from 'react';
import Layout from './Layout';

const Assignments = ({ user }) => {
  const [assignments, setAssignments] = useState([
    { id: 1, title: 'Bài tập ReactJS', description: 'Xây dựng ứng dụng React cơ bản', dueDate: '2023-06-15', submissions: 25, status: 'active' },
    { id: 2, title: 'Bài tập Node.js', description: 'Xây dựng API với Express', dueDate: '2023-06-20', submissions: 20, status: 'active' },
    { id: 3, title: 'Bài tập Database', description: 'Thiết kế cơ sở dữ liệu', dueDate: '2023-06-25', submissions: 15, status: 'active' },
    { id: 4, title: 'Bài tập HTML/CSS', description: 'Thiết kế giao diện responsive', dueDate: '2023-05-30', submissions: 30, status: 'completed' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAssignment = {
      id: assignments.length + 1,
      ...formData,
      submissions: 0,
      status: 'active'
    };
    setAssignments([...assignments, newAssignment]);
    setFormData({ title: '', description: '', dueDate: '' });
    setShowForm(false);
  };

  const deleteAssignment = (id) => {
    setAssignments(assignments.filter(assignment => assignment.id !== id));
  };

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Quản lý Bài tập</h1>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tạo bài tập mới
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Form tạo bài tập mới */}
          {showForm && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Tạo bài tập mới</h3>
              </div>
              <div className="border-t border-gray-200">
                <form onSubmit={handleSubmit}>
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Tiêu đề
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Mô tả
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                        Hạn nộp
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        id="dueDate"
                        required
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.dueDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Tạo bài tập
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Danh sách bài tập */}
          <div className="mt-8 flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bài tập
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hạn nộp
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đã nộp
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Hành động</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                                <div className="text-sm text-gray-500">{assignment.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{assignment.dueDate}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{assignment.submissions}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {assignment.status === 'active' ? 'Đang mở' : 'Đã đóng'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-3">
                              Xem
                            </a>
                            <button 
                              onClick={() => deleteAssignment(assignment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Assignments;