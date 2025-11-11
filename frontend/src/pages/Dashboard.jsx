// components/Dashboard.js
import React from 'react';

const Dashboard = () => {
  const stats = [
    { name: 'Bài tập đã giao', value: '12', change: '+2', changeType: 'increase' },
    { name: 'Bài tập cần chấm', value: '8', change: '+3', changeType: 'increase' },
    { name: 'Sinh viên đã nộp', value: '45', change: '+5', changeType: 'increase' },
    { name: 'Điểm trung bình', value: '7.8', change: '+0.2', changeType: 'increase' },
  ];

  const recentAssignments = [
    { id: 1, title: 'Bài tập ReactJS', dueDate: '2023-06-15', submissions: 25, graded: 18 },
    { id: 2, title: 'Bài tập Node.js', dueDate: '2023-06-20', submissions: 20, graded: 12 },
    { id: 3, title: 'Bài tập Database', dueDate: '2023-06-25', submissions: 15, graded: 5 },
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      {/* Thống kê */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Tổng quan</h3>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.name} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
              <dt>
                <div className="absolute bg-indigo-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Bài tập gần đây */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Bài tập gần đây</h3>
        <div className="mt-4 flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài tập</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn nộp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã nộp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã chấm</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAssignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{assignment.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{assignment.dueDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{assignment.submissions}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{assignment.graded}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href="#" className="text-indigo-600 hover:text-indigo-900">Xem chi tiết</a>
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
  );
};

export default Dashboard;
