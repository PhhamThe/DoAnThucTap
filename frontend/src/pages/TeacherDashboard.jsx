// components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [subjects, setSubjects] = useState([]);
  const tabs = [
    { name: 'past', label: 'QUÁ KHỨ' },
    { name: 'current', label: 'ĐANG DẠY' },
    { name: 'future', label: 'TƯƠNG LAI' },

  ];



  async function fetchSubject() {
    const json = await apiGet('api/get_subject_timeline_by_teacher');
    if (json?.success) {
      setSubjects(json.data);
    }
  }

  useEffect(() => {
    fetchSubject();
  }, []);



  const today = new Date();

  const filteredSubjects = subjects.filter((subject) => {
    const start = new Date(subject.start_date);
    const end = new Date(subject.end_date);

    if (activeTab === 'current') {
      return start <= today && today <= end;
    }

    if (activeTab === 'future') {
      return start > today;
    }

    if (activeTab === 'past') {
      return end < today;
    }

    return true;
  });

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-8xl mx-auto">

        {/* TAB HEADER */}
        <div className="flex s bg-white mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex-1 py-2 text-center font-medium transition-colors ${activeTab === tab.name ? 'bg-blue-800 text-white' : 'text-white bg-blue-500'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 cursor-pointer">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white border border-gray-300 p-4 transition-shadow"
            >
              <h3 className="font-semibold text-gray-800 mb-2">{subject.name}</h3>
              <p className="text-sm text-gray-600 mb-3">({subject.code})</p>


            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;
