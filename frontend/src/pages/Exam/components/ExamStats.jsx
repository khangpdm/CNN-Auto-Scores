import React from 'react';

export default function ExamStats({ filteredExams }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="text-sm text-gray-500">Tổng số</p>
        <p className="text-2xl font-bold text-gray-800">{filteredExams.length}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="text-sm text-gray-500">Nháp</p>
        <p className="text-2xl font-bold text-yellow-600">
          {filteredExams.filter(e => e.status === 'draft').length}
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="text-sm text-gray-500">Xuất bản</p>
        <p className="text-2xl font-bold text-blue-600">
          {filteredExams.filter(e => e.status === 'published').length}
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="text-sm text-gray-500">Đang chấm</p>
        <p className="text-2xl font-bold text-purple-600">
          {filteredExams.filter(e => e.status === 'grading').length}
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="text-sm text-gray-500">Hoàn thành</p>
        <p className="text-2xl font-bold text-green-600">
          {filteredExams.filter(e => e.status === 'completed').length}
        </p>
      </div>
    </div>
  );
}