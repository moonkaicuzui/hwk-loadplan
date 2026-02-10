/**
 * @fileoverview Tasks Hook
 * Task management hook with localStorage persistence.
 *
 * @module hooks/useTasks
 */

import { useState, useCallback, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'rachgia_tasks';

/**
 * Task status constants
 */
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

/**
 * Task priority constants
 */
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Generate unique task ID
 * @returns {string} Unique ID
 */
const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Task management hook
 * @returns {Object} Task state and methods
 */
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load tasks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure data integrity
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
    setLoading(false);
  }, []);

  // Save tasks to localStorage when changed
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error('Failed to save tasks:', error);
      }
    }
  }, [tasks, loading]);

  /**
   * Create a new task
   * @param {Object} taskData Task data
   * @returns {Object} Created task
   */
  const createTask = useCallback((taskData) => {
    const now = new Date().toISOString();
    const newTask = {
      id: generateId(),
      title: taskData.title || '',
      description: taskData.description || '',
      status: taskData.status || TASK_STATUS.PENDING,
      priority: taskData.priority || TASK_PRIORITY.MEDIUM,
      dueDate: taskData.dueDate || null,
      assignee: taskData.assignee || '',
      poNumber: taskData.poNumber || '',
      createdAt: now,
      updatedAt: now
    };

    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  /**
   * Update an existing task
   * @param {string} taskId Task ID
   * @param {Object} updates Fields to update
   */
  const updateTask = useCallback((taskId, updates) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    ));
  }, []);

  /**
   * Delete a task
   * @param {string} taskId Task ID
   */
  const deleteTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  /**
   * Update task status
   * @param {string} taskId Task ID
   * @param {string} newStatus New status
   */
  const updateStatus = useCallback((taskId, newStatus) => {
    updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  /**
   * Get task by ID
   * @param {string} taskId Task ID
   * @returns {Object|null} Task or null
   */
  const getTaskById = useCallback((taskId) => {
    return tasks.find(task => task.id === taskId) || null;
  }, [tasks]);

  /**
   * Get tasks filtered by status
   * @param {string} status Status to filter by
   * @returns {Array} Filtered tasks
   */
  const getTasksByStatus = useCallback((status) => {
    if (!status || status === 'all') return tasks;
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  /**
   * Get tasks filtered by priority
   * @param {string} priority Priority to filter by
   * @returns {Array} Filtered tasks
   */
  const getTasksByPriority = useCallback((priority) => {
    return tasks.filter(task => task.priority === priority);
  }, [tasks]);

  /**
   * Get tasks by PO number
   * @param {string} poNumber PO number
   * @returns {Array} Filtered tasks
   */
  const getTasksByPO = useCallback((poNumber) => {
    return tasks.filter(task => task.poNumber === poNumber);
  }, [tasks]);

  /**
   * Get overdue tasks
   * @returns {Array} Overdue tasks
   */
  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.dueDate || task.status === TASK_STATUS.COMPLETED) return false;
      return new Date(task.dueDate) < now;
    });
  }, [tasks]);

  /**
   * Calculate task statistics
   */
  const statistics = useMemo(() => {
    const stats = {
      total: tasks.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };

    const now = new Date();

    tasks.forEach(task => {
      // Count by status
      if (stats[task.status] !== undefined) {
        stats[task.status]++;
      }

      // Count by priority
      if (task.priority && stats.byPriority[task.priority] !== undefined) {
        stats.byPriority[task.priority]++;
      }

      // Count overdue
      if (task.dueDate && task.status !== TASK_STATUS.COMPLETED) {
        if (new Date(task.dueDate) < now) {
          stats.overdue++;
        }
      }
    });

    return stats;
  }, [tasks]);

  /**
   * Clear all tasks
   */
  const clearAllTasks = useCallback(() => {
    setTasks([]);
  }, []);

  /**
   * Sort tasks by various criteria
   * @param {string} sortBy Sort field
   * @param {string} order 'asc' or 'desc'
   * @returns {Array} Sorted tasks
   */
  const sortTasks = useCallback((sortBy = 'createdAt', order = 'desc') => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'priority':
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'createdAt':
        case 'updatedAt':
        default:
          comparison = new Date(a[sortBy] || 0).getTime() - new Date(b[sortBy] || 0).getTime();
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }, [tasks]);

  return {
    tasks,
    loading,
    statistics,
    createTask,
    updateTask,
    deleteTask,
    updateStatus,
    getTaskById,
    getTasksByStatus,
    getTasksByPriority,
    getTasksByPO,
    getOverdueTasks,
    sortTasks,
    clearAllTasks
  };
}

export default useTasks;
