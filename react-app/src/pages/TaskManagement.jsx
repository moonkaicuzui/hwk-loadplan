/**
 * @fileoverview Task Management Page
 * Production task management and tracking.
 *
 * @module pages/TaskManagement
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckSquare, Clock, AlertCircle, MoreVertical } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';

/**
 * Task Management Page Component
 * TODO: Implement full task management with Firebase integration
 */
export default function TaskManagement() {
  const { t } = useTranslation();
  const { state } = useDashboard();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('tasks.all', '전체'), count: 0 },
    { id: 'pending', label: t('tasks.pending', '대기'), count: 0 },
    { id: 'inProgress', label: t('tasks.inProgress', '진행중'), count: 0 },
    { id: 'completed', label: t('tasks.completed', '완료'), count: 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t('tasks.title', '작업 관리')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('tasks.subtitle', '생산 작업 현황 관리 및 추적')}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" />
          <span>{t('tasks.newTask', '새 작업')}</span>
        </button>
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-secondary">{t('tasks.pending', '대기')}</p>
              <p className="text-xl font-bold">--</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-secondary">{t('tasks.inProgress', '진행중')}</p>
              <p className="text-xl font-bold">--</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-secondary">{t('tasks.completed', '완료')}</p>
              <p className="text-xl font-bold">--</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-theme overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-secondary hover:text-primary'
                }
              `}
            >
              {tab.label}
              <span className={`
                px-2 py-0.5 text-xs rounded-full
                ${activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-secondary'
                }
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Task List Content */}
        <div className="p-4">
          <p className="text-center text-secondary py-16">
            {t('tasks.noTasks', '작업이 없습니다')}
          </p>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          {t('tasks.helpTitle', '작업 관리 도움말')}
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
          <li>• {t('tasks.help1', '새 작업 버튼을 클릭하여 작업을 생성합니다.')}</li>
          <li>• {t('tasks.help2', '작업 카드를 클릭하여 상세 내용을 확인합니다.')}</li>
          <li>• {t('tasks.help3', '드래그 앤 드롭으로 작업 상태를 변경할 수 있습니다.')}</li>
          <li>• {t('tasks.help4', '담당자를 지정하여 작업을 분배합니다.')}</li>
        </ul>
      </div>
    </div>
  );
}
