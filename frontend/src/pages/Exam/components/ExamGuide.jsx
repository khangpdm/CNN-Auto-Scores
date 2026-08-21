import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Upload, FileSpreadsheet, FileText,
  Download, HelpCircle
} from 'lucide-react';

const guideSteps = [
  {
    step: 'B1',
    title: 'Import số báo danh thí sinh',
    description: 'Import danh sách số báo danh của thí sinh cho cả kỳ thi. Có thể import nhiều lần để bổ sung.',
    icon: Upload,
  },
  {
    step: 'B2',
    title: 'Tạo các đợt thi',
    description: 'Mỗi đợt thi ứng với một đề thi được tổ chức. Bạn có thể tạo nhiều đợt thi cho cùng một kỳ thi.',
    icon: FileSpreadsheet,
  },
  {
    step: 'B3',
    title: 'Chấm bài thi',
    description: 'Trong đợt thi, lần lượt import mã đề thi và ảnh bài thi của học sinh, sau đó tiến hành chấm.',
    icon: FileText,
  },
];

export default function ExamGuide() {
  return (
    <div className="container mx-auto px-4 pt-6">
      <div className="bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] rounded-2xl p-6 border border-[#a5d6a7] shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#43a047] rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Hướng dẫn sử dụng ASC Marker</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guideSteps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white shadow-sm
              hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#43a047]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-[#43a047] font-bold text-lg">{item.step}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4 text-[#43a047]" />
                      <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 pt-4 border-t border-[#a5d6a7]/50">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Download className="w-4 h-4 text-[#43a047]" />
            <span className="font-medium">Tải về các mẫu phiếu:</span>
            <a
              href="https://drive.google.com/drive/folders/1p-syZ-YsEzwCXVWbSUumMVD6HxwCPHdG?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#43a047] font-semibold hover:underline"
            >
              Tại đây
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <HelpCircle className="w-4 h-4 text-[#43a047]" />
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#43a047] font-semibold hover:underline"
            >
              Xem thêm hướng dẫn tại đây
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}