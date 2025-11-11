// src/components/CourseCard.js
import React from 'react';
import { Link } from 'react-router-dom';

function CourseCard({ course }) {
  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-md transition">
      <h3 className="text-xl font-semibold">{course.title}</h3>
      <p className="text-gray-600">{course.description}</p>
      <Link to={`/courses/${course.id}`} className="mt-2 inline-block text-blue-500 hover:underline">
        View Details
      </Link>
    </div>
  );
}
export default CourseCard;
