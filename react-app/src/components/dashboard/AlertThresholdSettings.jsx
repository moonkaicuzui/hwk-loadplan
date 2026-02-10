/**
 * @fileoverview Alert Threshold Settings Component
 * Allows users to configure personalized alert thresholds.
 *
 * @module components/dashboard/AlertThresholdSettings
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Save, X, Bell, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import {
  getAlertThresholds,
  setAlertThresholds,
  DEFAULT_THRESHOLDS
} from '../../services/cloudFunctions';

/**
 * Alert Threshold Settings Modal
 */
export default function AlertThresholdSettings({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load saved thresholds on mount
  useEffect(() => {
    async function loadThresholds() {
      const savedThresholds = await getAlertThresholds();
      setThresholds(savedThresholds);
    }
    if (isOpen) {
      loadThresholds();
    }
  }, [isOpen]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      await setAlertThresholds(thresholds);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving thresholds:', error);
    } finally {
      setSaving(false);
    }
  };

  // Update threshold value
  const updateThreshold = (category, field, value) => {
    setThresholds(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: typeof value === 'boolean' ? value : Number(value)
      }
    }));
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setThresholds(DEFAULT_THRESHOLDS);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {t('settings.alertThresholds', '알림 임계값 설정')}
              </h2>
              <p className="text-sm text-secondary">
                {t('settings.alertThresholdsDesc', '나에게 맞는 알림 기준을 설정하세요')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Delayed Orders */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                {t('settings.delayedAlerts', '지연 알림')}
              </h3>
              <label className="ml-auto flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thresholds.delayed?.enabled ?? true}
                  onChange={(e) => updateThreshold('delayed', 'enabled', e.target.checked)}
                  className="rounded text-red-500 focus:ring-red-500"
                />
                <span className="text-sm">{t('common.enabled', '활성화')}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('settings.orderCountThreshold', '주문 건수 임계값')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={thresholds.delayed?.orderCount ?? 1}
                    onChange={(e) => updateThreshold('delayed', 'orderCount', e.target.value)}
                    disabled={!thresholds.delayed?.enabled}
                    className="w-24 px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-secondary">건 이상일 때</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('settings.quantityThreshold', '수량 임계값')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={thresholds.delayed?.quantity ?? 0}
                    onChange={(e) => updateThreshold('delayed', 'quantity', e.target.value)}
                    disabled={!thresholds.delayed?.enabled}
                    className="w-32 px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-secondary">pcs 이상 (0=무시)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Orders */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">
                {t('settings.warningAlerts', '경고 알림')}
              </h3>
              <label className="ml-auto flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thresholds.warning?.enabled ?? true}
                  onChange={(e) => updateThreshold('warning', 'enabled', e.target.checked)}
                  className="rounded text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-sm">{t('common.enabled', '활성화')}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('settings.orderCountThreshold', '주문 건수 임계값')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={thresholds.warning?.orderCount ?? 10}
                    onChange={(e) => updateThreshold('warning', 'orderCount', e.target.value)}
                    disabled={!thresholds.warning?.enabled}
                    className="w-24 px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-secondary">건 이상일 때</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('settings.daysBeforeCrd', 'CRD 임박 기준')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={thresholds.warning?.daysBeforeCrd ?? 3}
                    onChange={(e) => updateThreshold('warning', 'daysBeforeCrd', e.target.value)}
                    disabled={!thresholds.warning?.enabled}
                    className="w-24 px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-secondary">일 이내</span>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-green-700 dark:text-green-400">
                {t('settings.completionAlerts', '완료율 알림')}
              </h3>
              <label className="ml-auto flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thresholds.completion?.enabled ?? true}
                  onChange={(e) => updateThreshold('completion', 'enabled', e.target.checked)}
                  className="rounded text-green-500 focus:ring-green-500"
                />
                <span className="text-sm">{t('common.enabled', '활성화')}</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('settings.minCompletionRate', '최소 완료율')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholds.completion?.minRate ?? 80}
                  onChange={(e) => updateThreshold('completion', 'minRate', e.target.value)}
                  disabled={!thresholds.completion?.enabled}
                  className="w-24 px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                />
                <span className="text-sm text-secondary">% 미만일 때 알림</span>
              </div>
            </div>
          </div>

          {/* Notification Methods */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                {t('settings.notificationMethods', '알림 방법')}
              </h3>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thresholds.notifications?.dashboardBanner ?? true}
                  onChange={(e) => updateThreshold('notifications', 'dashboardBanner', e.target.checked)}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm">대시보드 배너</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thresholds.notifications?.browserNotification ?? true}
                  onChange={(e) => updateThreshold('notifications', 'browserNotification', e.target.checked)}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm">브라우저 알림</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer opacity-50">
                <input
                  type="checkbox"
                  checked={thresholds.notifications?.email ?? false}
                  onChange={(e) => updateThreshold('notifications', 'email', e.target.checked)}
                  disabled
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm">이메일 (준비 중)</span>
              </label>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-secondary mr-2">프리셋:</span>
            <button
              onClick={() => setThresholds({
                delayed: { orderCount: 1, quantity: 0, enabled: true },
                warning: { orderCount: 5, daysBeforeCrd: 3, enabled: true },
                completion: { minRate: 90, enabled: true },
                notifications: { dashboardBanner: true, browserNotification: true, email: false }
              })}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 transition-colors"
            >
              👨‍💼 공장장 (엄격)
            </button>
            <button
              onClick={() => setThresholds({
                delayed: { orderCount: 5, quantity: 5000, enabled: true },
                warning: { orderCount: 20, daysBeforeCrd: 3, enabled: true },
                completion: { minRate: 80, enabled: true },
                notifications: { dashboardBanner: true, browserNotification: false, email: false }
              })}
              className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 transition-colors"
            >
              📊 관리자 (표준)
            </button>
            <button
              onClick={() => setThresholds({
                delayed: { orderCount: 10, quantity: 10000, enabled: true },
                warning: { orderCount: 50, daysBeforeCrd: 5, enabled: true },
                completion: { minRate: 70, enabled: true },
                notifications: { dashboardBanner: true, browserNotification: false, email: false }
              })}
              className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 transition-colors"
            >
              👔 경영진 (요약)
            </button>
            <button
              onClick={resetToDefaults}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 transition-colors"
            >
              ↺ 기본값
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-theme bg-secondary/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-theme rounded-lg hover:bg-hover transition-colors"
          >
            {t('common.cancel', '취소')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors ${
              saved
                ? 'bg-green-500'
                : saving
                ? 'bg-blue-400 cursor-wait'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {t('common.saved', '저장됨')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saving ? t('common.saving', '저장 중...') : t('common.save', '저장')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
