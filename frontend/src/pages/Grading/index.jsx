import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSessionDetail } from './hooks/useSessionDetail';
import {
    ArrowLeft, Loader2, FileText,
    Users, FileCheck, Image, TrendingUp,
    CheckCircle
} from 'lucide-react';

import StudentsTab from './components/StudentsTab';
import GradingHeader from './components/GradingHeader';
import AnswerKeyTab from './components/AnswerKeyTab';
import PaperUploadTab from './components/PaperUploadTab';
import GradingTab from './components/GradingTab';

export default function SessionDetailPage() {
    const { examId, sessionId } = useParams();
    const {
        // Session
        session,
        loading,

        // Students
        students,
        studentsLoading,
        studentsPagination,
        fetchStudents,
        uploadStudents,
        deleteStudent,
        deleteAllStudents,

        // Answer Keys
        answerKeys,
        answerKeysLoading,
        fetchAnswerKeys,
        uploadAnswerKey,
        deleteAnswerKey,

        // Papers
        papers,
        papersLoading,
        scanBatchId,
        scanStatus,
        isScanning,
        scanPapers,

        // Results
        results,
        resultsLoading,
        resultsPagination,
        fetchResults,
        updateResult,
        deleteResult,
        clearAllResults,
        exportResult,

        // Tab
        activeTab,
        setActiveTab,
        getResultDetail,
      } = useSessionDetail();



    const tabs = [
        {
            id: 'students',
            label: 'Học sinh',
            icon: Users,
            badge: studentsPagination?.total_records || 0
        },
        {
            id: 'answer-key',
            label: 'Đáp án',
            icon: FileCheck,
            badge: answerKeys.length || 0
        },
        {
          id: 'papers',
          label: 'Bài làm',
          icon: Image,
          badge: papers.length || 0
        },
        {
          id: 'grading',
          label: 'Chấm điểm',
          icon: TrendingUp,
          badge: resultsPagination?.total_records || 0
        },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'students':
                return (
                    <StudentsTab
                      sessionId={sessionId}
                      students={students}
                      loading={studentsLoading}
                      pagination={studentsPagination}
                      onSearch={fetchStudents}
                      onUpload={uploadStudents}
                      onDelete={deleteStudent}
                      onDeleteAll={deleteAllStudents}
                    />
                );
            case 'answer-key':
                return (
                    <AnswerKeyTab
                        sessionId={sessionId}
                        answerKeys={answerKeys}
                        loading={answerKeysLoading}
                        onUpload={uploadAnswerKey}
                        onDelete={deleteAnswerKey}
                        onRefresh={fetchAnswerKeys}
                    />
                );
            case 'papers':
                return (
                    <PaperUploadTab
                      sessionId={sessionId}
                      papers={papers}
                      loading={papersLoading}
                      scanBatchId={scanBatchId}
                      scanStatus={scanStatus}
                      isScanning={isScanning}
                      onScan={scanPapers}
                      onRefresh={() => {
                      }}
                    />
                );
            case 'grading':
                return (
                  <GradingTab
                    sessionId={sessionId}
                    results={results}
                    loading={resultsLoading}
                    pagination={resultsPagination}
                    students={students}
                    answerKeys={answerKeys}
                    onSearch={fetchResults}
                    onUpdate={updateResult}
                    onDelete={deleteResult}
                    onClearAll={clearAllResults}
                    onExport={exportResult}
                    onRefresh={fetchResults}
                    onGetResultDetail={getResultDetail}
                  />
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#43a047]"/>
                    <p className="mt-4 text-gray-500">Đang tải thông tin đợt thi...</p>
                </div>
            </div>
        );
    }

    if(!session){
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4"/>
                    <p className="text-xl font-medium text-gray-600"></p>
                    <Link to={`/ky-thi/${examId}`} className="text-[#43a047] hover:underline mt-2 inline-block">
                        Quay lại kỳ thi
                    </Link>
                </div>
            </div>
        );
    }



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <GradingHeader
        session = {session}
        totalStudents = {studentsPagination?.total_records}
        totalGraded = {0}
        examId={examId}
        />

        {/* ===== TABS ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 px-6">
            <nav className="flex gap-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${activeTab === tab.id 
                      ? 'border-[#43a047] text-[#43a047]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className={`
                        ml-1 px-2 py-0.5 text-xs rounded-full
                        ${activeTab === tab.id 
                          ? 'bg-[#e8f5e9] text-[#43a047]' 
                          : 'bg-gray-100 text-gray-600'}
                      `}>
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* ===== NỘI DUNG TAB ===== */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}