// src/components/LessonItem.js
import React from 'react';
import { Link } from 'react-router-dom';

function LessonItem({ lesson }) {
  return (
    <div className="border-b py-2">
      <Link to={`/lessons/${lesson.id}`} className="text-blue-600 hover:underline">
        {lesson.title}
      </Link>
    </div>
  );
}
export default LessonItem;
