/**
 * @fileoverview Task Management Page
 * Production task management and tracking with full CRUD operations.
 *
 * @module pages/TaskManagement
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  CheckSquare,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Calendar,
  User,
  FileText,
  Flag,
  AlertTriangle,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { useTasks, TASK_STATUS, TASK_PRIORITY } from '../hooks/useTasks';

/**
 * Priority configuration for display
 */
const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-300' },
  medium: { label: 'Medium', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300' },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300' },
  critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-300' }
};

/**
 * Status configuration for display
 */
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: PlayCircle },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle }
};

/**
 * Task Form Modal Component
 */
function TaskFormModal({ task, onSubmit, onClose }) {
  const { t } = useTranslation();
  const isEditMode = !!task;

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || TASK_STATUS.PENDING,
    priority: task?.priority || TASK_PRIORITY.MEDIUM,
    dueDate: task?.dueDate || '',
    assignee: task?.assignee || '',
    poNumber: task?.poNumber || ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = t('tasks.form.titleRequired', 'Title is required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-primary">
              {isEditMode ? t('tasks.form.editTitle', 'Edit Task') : t('tasks.form.createTitle', 'Create New Task')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('tasks.form.title', 'Task Title')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={t('tasks.form.titlePlaceholder', 'Enter task title')}
              className={`w-full px-4 py-2 border rounded-lg bg-card focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-theme'
              }`}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('tasks.form.description', 'Description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('tasks.form.descriptionPlaceholder', 'Enter task description')}
              rows={3}
              className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                {t('tasks.form.status', 'Status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
              >
                <option value={TASK_STATUS.PENDING}>{t('tasks.pending', 'Pending')}</option>
                <option value={TASK_STATUS.IN_PROGRESS}>{t('tasks.inProgress', 'In Progress')}</option>
                <option value={TASK_STATUS.COMPLETED}>{t('tasks.completed', 'Completed')}</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                {t('tasks.form.priority', 'Priority')}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
              >
                <option value={TASK_PRIORITY.LOW}>{t('tasks.priority.low', 'Low')}</option>
                <option value={TASK_PRIORITY.MEDIUM}>{t('tasks.priority.medium', 'Medium')}</option>
                <option value={TASK_PRIORITY.HIGH}>{t('tasks.priority.high', 'High')}</option>
                <option value={TASK_PRIORITY.CRITICAL}>{t('tasks.priority.critical', 'Critical')}</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('tasks.form.dueDate', 'Due Date')}
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assignee and PO Number Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                {t('tasks.form.assignee', 'Assignee')}
              </label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => handleChange('assignee', e.target.value)}
                placeholder={t('tasks.form.assigneePlaceholder', 'Assignee name')}
                className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* PO Number */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                {t('tasks.form.poNumber', 'PO Number')}
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => handleChange('poNumber', e.target.value)}
                placeholder={t('tasks.form.poPlaceholder', 'Related PO#')}
                className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-theme rounded-lg hover:bg-hover transition-colors"
            >
              {t('tasks.form.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditMode ? t('tasks.form.update', 'Update Task') : t('tasks.form.create', 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Delete Confirmation Modal
 */
function DeleteConfirmModal({ task, onConfirm, onCancel }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-primary">
            {t('tasks.delete.title', 'Delete Task')}
          </h3>
        </div>
        <p className="text-secondary mb-2">
          {t('tasks.delete.message', 'Are you sure you want to delete this task?')}
        </p>
        <p className="text-sm font-medium text-primary mb-6 p-2 bg-gray-100 dark:bg-gray-800 rounded">
          "{task.title}"
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-theme rounded-lg hover:bg-hover transition-colors"
          >
            {t('tasks.delete.cancel', 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('tasks.delete.confirm', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Task Card Component
 */
function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.status === TASK_STATUS.COMPLETED) return false;
    return new Date(task.dueDate) < new Date();
  }, [task.dueDate, task.status]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(task.id, newStatus);
    setShowMenu(false);
  };

  return (
    <div className={`bg-card rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow p-4 ${priorityConfig.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title and Priority */}
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-primary truncate">{task.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig.bg} ${priorityConfig.color}`}>
              {t(`tasks.priority.${task.priority}`, priorityConfig.label)}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-secondary line-clamp-2 mb-3">{task.description}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
            {/* Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig.bg}`}>
              <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
              <span className={statusConfig.color}>
                {t(`tasks.${task.status === 'in_progress' ? 'inProgress' : task.status}`, statusConfig.label)}
              </span>
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.dueDate)}</span>
                {isOverdue && (
                  <span className="text-red-500 font-medium">
                    ({t('tasks.overdue', 'Overdue')})
                  </span>
                )}
              </div>
            )}

            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{task.assignee}</span>
              </div>
            )}

            {/* PO Number */}
            {task.poNumber && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{task.poNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-hover transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-secondary" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-card rounded-lg shadow-lg border border-theme z-20 overflow-hidden">
                {/* Status Changes */}
                <div className="p-2 border-b border-theme">
                  <p className="text-xs text-secondary px-2 mb-1">{t('tasks.changeStatus', 'Change Status')}</p>
                  {Object.entries(TASK_STATUS).map(([key, value]) => (
                    <button
                      key={value}
                      onClick={() => handleStatusChange(value)}
                      disabled={task.status === value}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                        task.status === value
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                          : 'hover:bg-hover text-primary'
                      }`}
                    >
                      {STATUS_CONFIG[value]?.icon && (
                        <span className={STATUS_CONFIG[value].color}>
                          {(() => {
                            const Icon = STATUS_CONFIG[value].icon;
                            return <Icon className="w-4 h-4" />;
                          })()}
                        </span>
                      )}
                      {t(`tasks.${value === 'in_progress' ? 'inProgress' : value}`, STATUS_CONFIG[value]?.label)}
                    </button>
                  ))}
                </div>

                {/* Edit / Delete */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-primary hover:bg-hover rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('tasks.edit', 'Edit')}
                  </button>
                  <button
                    onClick={() => {
                      onDelete(task);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('tasks.delete.button', 'Delete')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Task Management Page Component
 */
export default function TaskManagement() {
  const { t } = useTranslation();
  const {
    tasks,
    loading,
    statistics,
    createTask,
    updateTask,
    deleteTask,
    updateStatus,
    getTasksByStatus
  } = useTasks();

  const [activeTab, setActiveTab] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  // Get filtered tasks based on active tab
  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasks;
    if (activeTab === 'inProgress') return getTasksByStatus(TASK_STATUS.IN_PROGRESS);
    return getTasksByStatus(activeTab);
  }, [activeTab, tasks, getTasksByStatus]);

  const tabs = [
    { id: 'all', label: t('tasks.all', 'All'), count: statistics.total },
    { id: 'pending', label: t('tasks.pending', 'Pending'), count: statistics.pending },
    { id: 'inProgress', label: t('tasks.inProgress', 'In Progress'), count: statistics.in_progress },
    { id: 'completed', label: t('tasks.completed', 'Completed'), count: statistics.completed }
  ];

  // Handle form submission
  const handleFormSubmit = (formData) => {
    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      createTask(formData);
    }
    setShowFormModal(false);
    setEditingTask(null);
  };

  // Handle edit button click
  const handleEdit = (task) => {
    setEditingTask(task);
    setShowFormModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deletingTask) {
      deleteTask(deletingTask.id);
      setDeletingTask(null);
    }
  };

  // Handle new task button
  const handleNewTask = () => {
    setEditingTask(null);
    setShowFormModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t('tasks.title', 'Task Management')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('tasks.subtitle', 'Production task tracking and management')}
          </p>
        </div>
        <button
          onClick={handleNewTask}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('tasks.newTask', 'New Task')}</span>
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
              <p className="text-sm text-secondary">{t('tasks.pending', 'Pending')}</p>
              <p className="text-xl font-bold">{statistics.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-secondary">{t('tasks.inProgress', 'In Progress')}</p>
              <p className="text-xl font-bold">{statistics.in_progress}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-secondary">{t('tasks.completed', 'Completed')}</p>
              <p className="text-xl font-bold">{statistics.completed}</p>
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
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-secondary mb-4">
                {t('tasks.noTasks', 'No tasks found')}
              </p>
              <button
                onClick={handleNewTask}
                className="inline-flex items-center gap-2 px-4 py-2 text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('tasks.createFirst', 'Create your first task')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={setDeletingTask}
                  onStatusChange={updateStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          {t('tasks.helpTitle', 'Task Management Help')}
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
          <li>* {t('tasks.help1', 'Click the New Task button to create a task.')}</li>
          <li>* {t('tasks.help2', 'Click the menu icon on a task to edit or delete it.')}</li>
          <li>* {t('tasks.help3', 'Change task status from the menu to track progress.')}</li>
          <li>* {t('tasks.help4', 'Assign team members and link PO numbers for tracking.')}</li>
        </ul>
      </div>

      {/* Task Form Modal */}
      {showFormModal && (
        <TaskFormModal
          task={editingTask}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowFormModal(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <DeleteConfirmModal
          task={deletingTask}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
