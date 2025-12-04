import React, { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

const StudentDashboard = () => {
    const [activeTab, setActiveTab] = useState('current');

    const tabs = [
        { id: 'past', label: 'QUÁ KHỨ' },
        { id: 'current', label: 'ĐANG HỌC' },
        { id: 'future', label: 'TƯƠNG LAI' },
    ];

    const [subjects, setSubjects] = useState([]);

    async function fetchSubject() {
        const json = await apiGet('api/get_subject_timeline_by_student');
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
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 text-center font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-800 text-white' : 'text-white bg-blue-500'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* SUBJECT LIST */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSubjects.map((subject) => (
                        <div
                            key={subject.id}
                            className="bg-white border border-gray-300 p-4 transition-shadow"
                        >
                            <h3 className="font-semibold text-gray-800 mb-2">{subject.name}-{subject.subject_name}</h3>
                            <p className="text-sm text-gray-600 mb-3">({subject.code})</p>

                            <div className="flex items-center justify-between">
                                <div className="w-3/4 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-blue-500 transition-all duration-500 ease-out"
                                        style={{ width: `${subject.progress || 0}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                    {subject.progress || 0}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default StudentDashboard;