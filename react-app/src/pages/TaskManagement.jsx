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
  PlayCircle,
  Image as ImageIcon,
  Upload,
  ZoomIn
} from 'lucide-react';
import { useTasks, TASK_STATUS, TASK_PRIORITY, IMAGE_CONSTRAINTS, compressImage } from '../hooks/useTasks';

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
 * Image Lightbox Component for viewing full-size images
 */
function ImageLightbox({ images, currentIndex, onClose, onNavigate }) {
  const { t } = useTranslation();
  const image = images[currentIndex];

  if (!image) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
    if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label={t('tasks.images.lightbox', '이미지 뷰어')}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        aria-label={t('tasks.images.close', '닫기')}
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={t('tasks.images.prev', '이전 이미지')}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={t('tasks.images.next', '다음 이미지')}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Image */}
      <img
        src={image.dataUrl}
        alt={image.name}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Image info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-lg text-white text-sm">
        <span>{image.name}</span>
        {images.length > 1 && (
          <span className="ml-2 text-white/70">
            ({currentIndex + 1} / {images.length})
          </span>
        )}
      </div>
    </div>
  );
}

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
    poNumber: task?.poNumber || '',
    images: task?.images || []
  });

  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

  /**
   * Handle image file selection
   */
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageError('');
    setIsUploading(true);

    try {
      const currentImages = formData.images || [];
      const remainingSlots = IMAGE_CONSTRAINTS.MAX_IMAGES_PER_TASK - currentImages.length;

      if (remainingSlots <= 0) {
        setImageError(t('tasks.images.maxReached', `최대 ${IMAGE_CONSTRAINTS.MAX_IMAGES_PER_TASK}개의 이미지만 첨부할 수 있습니다.`));
        setIsUploading(false);
        return;
      }

      const filesToProcess = files.slice(0, remainingSlots);
      const newImages = [];

      for (const file of filesToProcess) {
        // Validate file type
        if (!IMAGE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
          setImageError(t('tasks.images.invalidType', '지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP)'));
          continue;
        }

        // Validate file size
        if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
          setImageError(t('tasks.images.tooLarge', '파일 크기가 너무 큽니다. (최대 5MB)'));
          continue;
        }

        try {
          const dataUrl = await compressImage(file);
          newImages.push({
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dataUrl,
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error('Failed to compress image:', err);
          setImageError(t('tasks.images.compressFailed', '이미지 압축에 실패했습니다.'));
        }
      }

      if (newImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...newImages]
        }));
      }

      if (files.length > remainingSlots) {
        setImageError(t('tasks.images.someskipped', `${files.length - remainingSlots}개의 이미지가 건너뛰어졌습니다. (최대 ${IMAGE_CONSTRAINTS.MAX_IMAGES_PER_TASK}개)`));
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setImageError(t('tasks.images.uploadFailed', '이미지 업로드에 실패했습니다.'));
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  /**
   * Remove image from form data
   */
  const handleRemoveImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter(img => img.id !== imageId)
    }));
    setImageError('');
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

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('tasks.images.label', '사진 첨부')}
              <span className="text-secondary font-normal ml-2">
                ({(formData.images || []).length}/{IMAGE_CONSTRAINTS.MAX_IMAGES_PER_TASK})
              </span>
            </label>

            {/* Upload Button */}
            <div className="mt-2">
              <label
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg
                  cursor-pointer transition-colors
                  ${(formData.images || []).length >= IMAGE_CONSTRAINTS.MAX_IMAGES_PER_TASK
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
                    : 'border-blue-300 dark:border-blue-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }
                `}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-secondary">{t('tasks.images.uploading', '업로드 중...')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      {t('tasks.images.addPhotos', '사진 추가')}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={(formData.images || []).length >= IMAGE_CONSTRAINTS.MAX_IMAGES_PER_TASK || isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Error Message */}
            {imageError && (
              <p className="text-sm text-red-500 mt-2">{imageError}</p>
            )}

            {/* Image Previews */}
            {(formData.images || []).length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {formData.images.map((image) => (
                  <div key={image.id} className="relative group aspect-square">
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full h-full object-cover rounded-lg border border-theme"
                    />
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full
                                 flex items-center justify-center opacity-0 group-hover:opacity-100
                                 transition-opacity shadow-md hover:bg-red-600"
                      aria-label={t('tasks.images.remove', '이미지 삭제')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {/* Image name tooltip */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs
                                    px-1 py-0.5 rounded-b-lg truncate opacity-0 group-hover:opacity-100
                                    transition-opacity">
                      {image.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Help text */}
            <p className="text-xs text-secondary mt-2">
              {t('tasks.images.help', 'JPEG, PNG, GIF, WebP 형식 지원. 최대 5MB, 800px 너비로 자동 압축됩니다.')}
            </p>
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
function TaskCard({ task, onEdit, onDelete, onStatusChange, onImageClick }) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const taskImages = task.images || [];

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

            {/* Image Count */}
            {taskImages.length > 0 && (
              <div className="flex items-center gap-1 text-blue-500">
                <ImageIcon className="w-3 h-3" />
                <span>{taskImages.length}</span>
              </div>
            )}
          </div>

          {/* Image Thumbnails */}
          {taskImages.length > 0 && (
            <div className="flex gap-1 mt-3">
              {taskImages.slice(0, 4).map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => onImageClick(task, index)}
                  className="relative w-12 h-12 rounded-md overflow-hidden border border-theme
                             hover:opacity-80 transition-opacity group"
                  aria-label={t('tasks.images.view', '이미지 보기')}
                >
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors
                                  flex items-center justify-center">
                    <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
              {taskImages.length > 4 && (
                <button
                  onClick={() => onImageClick(task, 0)}
                  className="w-12 h-12 rounded-md border border-theme bg-gray-100 dark:bg-gray-800
                             flex items-center justify-center text-sm font-medium text-secondary
                             hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  +{taskImages.length - 4}
                </button>
              )}
            </div>
          )}
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
  const [lightboxState, setLightboxState] = useState({ isOpen: false, images: [], currentIndex: 0 });

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

  // Handle image click to open lightbox
  const handleImageClick = (task, imageIndex) => {
    setLightboxState({
      isOpen: true,
      images: task.images || [],
      currentIndex: imageIndex
    });
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxState({ isOpen: false, images: [], currentIndex: 0 });
  };

  // Navigate in lightbox
  const navigateLightbox = (newIndex) => {
    setLightboxState(prev => ({ ...prev, currentIndex: newIndex }));
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
                  onImageClick={handleImageClick}
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

      {/* Image Lightbox */}
      {lightboxState.isOpen && (
        <ImageLightbox
          images={lightboxState.images}
          currentIndex={lightboxState.currentIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </div>
  );
}
