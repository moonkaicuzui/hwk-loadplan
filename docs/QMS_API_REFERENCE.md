# QMS API Reference

**Version**: v18
**Last Updated**: 2026-01-18

## Overview

This document describes the QMSManager class API for integrating with the Quality Management System.

---

## QMSManager Class

### Constructor

```javascript
const qmsManager = new QMSManager();
```

Creates a new QMSManager instance. Automatically initializes settings from localStorage.

---

## Properties

### `storageKey`
- **Type**: `string`
- **Value**: `'rachgia_qms_settings'`
- **Description**: LocalStorage key for QMS settings

### `cacheKeys`
- **Type**: `Object`
- **Description**: Cache keys for different data types

```javascript
{
  targets: 'qms_targets_cache',
  tasks: 'qms_tasks_cache',
  results: 'qms_results_cache'
}
```

### `googleSheetsConfig`
- **Type**: `Object`
- **Description**: Google Sheets API configuration

```javascript
{
  spreadsheetId: string | null,
  clientId: string | null,
  accessToken: string | null
}
```

### `currentUser`
- **Type**: `Object | null`
- **Description**: Current authenticated user info

```javascript
{
  email: string,
  name: string,
  picture: string,
  role: 'admin' | 'manager' | 'inspector' | 'viewer'
}
```

### `syncInterval`
- **Type**: `number`
- **Default**: `30000` (30 seconds)
- **Description**: Auto-sync interval in milliseconds

---

## Authentication Methods

### `init()`

Initializes the QMS system.

```javascript
await qmsManager.init();
```

**Returns**: `Promise<void>`

**Behavior**:
1. Loads settings from localStorage
2. Checks for existing authentication
3. Initializes Google API client if configured

---

### `checkAuth()`

Checks current authentication status.

```javascript
const isAuthenticated = await qmsManager.checkAuth();
```

**Returns**: `Promise<boolean>`

---

### `signIn()`

Initiates Google OAuth sign-in flow.

```javascript
await qmsManager.signIn();
```

**Returns**: `Promise<Object>` - User object

**Throws**: `Error` if sign-in fails

**Example**:
```javascript
try {
  const user = await qmsManager.signIn();
  console.log('Logged in as:', user.email);
} catch (error) {
  console.error('Sign-in failed:', error.message);
}
```

---

### `signOut()`

Signs out the current user.

```javascript
await qmsManager.signOut();
```

**Returns**: `Promise<void>`

---

## Google Sheets CRUD Methods

### `fetchFromSheet(sheetName, range)`

Fetches data from a Google Sheet.

```javascript
const data = await qmsManager.fetchFromSheet('QMS_Targets', 'A:Z');
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| sheetName | `string` | Name of the sheet |
| range | `string` | A1 notation range (optional) |

**Returns**: `Promise<Array<Array<any>>>` - 2D array of values

**Example**:
```javascript
const targets = await qmsManager.fetchFromSheet('QMS_Targets', 'A2:N');
// Returns: [['target-001', 'PO123', ...], ['target-002', 'PO456', ...]]
```

---

### `appendToSheet(sheetName, values)`

Appends rows to a Google Sheet.

```javascript
await qmsManager.appendToSheet('QMS_Targets', [
  ['target-003', 'PO789', 'Article1', 'Model1', ...]
]);
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| sheetName | `string` | Name of the sheet |
| values | `Array<Array<any>>` | 2D array of values to append |

**Returns**: `Promise<Object>` - API response

---

### `updateSheetRow(sheetName, rowIndex, values)`

Updates a specific row in a Google Sheet.

```javascript
await qmsManager.updateSheetRow('QMS_Tasks', 5, ['task-001', ...newValues]);
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| sheetName | `string` | Name of the sheet |
| rowIndex | `number` | 1-based row index |
| values | `Array<any>` | Values for the row |

**Returns**: `Promise<Object>` - API response

---

### `deleteSheetRow(sheetName, rowIndex)`

Deletes a row from a Google Sheet.

```javascript
await qmsManager.deleteSheetRow('QMS_Targets', 10);
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| sheetName | `string` | Name of the sheet |
| rowIndex | `number` | 1-based row index |

**Returns**: `Promise<void>`

---

## Target Management Methods

### `registerTarget(orderData)`

Registers an order as a QMS monitoring target.

```javascript
const target = await qmsManager.registerTarget({
  poNumber: 'PO123456',
  article: 'ART001',
  model: 'MODEL-A',
  factory: 'A',
  destination: 'Netherlands',
  quantity: 1000,
  crd: '2026-02-15',
  sddValue: '2026-02-10'
});
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| orderData | `Object` | Order data to register |

**Order Data Schema**:
```typescript
interface OrderData {
  poNumber: string;
  article: string;
  model: string;
  factory: string;
  destination: string;
  quantity: number;
  crd: string;        // YYYY-MM-DD
  sddValue: string;   // YYYY-MM-DD
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
}
```

**Returns**: `Promise<Object>` - Created target object with `targetId`

---

### `getTargets(filters)`

Retrieves targets with optional filtering.

```javascript
const targets = await qmsManager.getTargets({
  status: 'active',
  factory: 'A'
});
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| filters | `Object` | Filter criteria (optional) |

**Filter Options**:
```typescript
interface TargetFilters {
  status?: 'active' | 'completed' | 'cancelled';
  factory?: string;
  destination?: string;
  priority?: 'high' | 'medium' | 'low';
  registeredBy?: string;
}
```

**Returns**: `Promise<Array<Target>>` - Array of target objects

---

### `updateTargetStatus(targetId, status)`

Updates the status of a target.

```javascript
await qmsManager.updateTargetStatus('target-001', 'completed');
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| targetId | `string` | Target ID |
| status | `string` | New status |

**Returns**: `Promise<void>`

---

### `deleteTarget(targetId)`

Deletes a target.

```javascript
await qmsManager.deleteTarget('target-001');
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| targetId | `string` | Target ID to delete |

**Returns**: `Promise<void>`

---

## Task Management Methods

### `createTask(taskData)`

Creates a new task for a target.

```javascript
const task = await qmsManager.createTask({
  targetId: 'target-001',
  taskType: 'inspection',
  taskTitle: 'Final Quality Check',
  taskDescription: 'Check all items before shipping',
  assignedTo: 'inspector@example.com',
  dueDate: '2026-02-14',
  priority: 'high'
});
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| taskData | `Object` | Task data |

**Task Data Schema**:
```typescript
interface TaskData {
  targetId: string;
  taskType: 'inspection' | 'rework' | 'custom';
  taskTitle: string;
  taskDescription?: string;
  assignedTo: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  processStage?: string;
  quantity?: number;
  customFields?: object;
}
```

**Returns**: `Promise<Object>` - Created task object with `taskId`

---

### `getTasks(filters)`

Retrieves tasks with optional filtering.

```javascript
const tasks = await qmsManager.getTasks({
  status: 'pending',
  assignedTo: 'inspector@example.com'
});
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| filters | `Object` | Filter criteria (optional) |

**Filter Options**:
```typescript
interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  targetId?: string;
  taskType?: string;
  assignedTo?: string;
  priority?: 'high' | 'medium' | 'low';
}
```

**Returns**: `Promise<Array<Task>>` - Array of task objects

---

### `updateTaskStatus(taskId, status)`

Updates the status of a task.

```javascript
await qmsManager.updateTaskStatus('task-001', 'in_progress');
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| taskId | `string` | Task ID |
| status | `string` | New status |

**Returns**: `Promise<void>`

---

### `assignTask(taskId, assignee)`

Reassigns a task to a different user.

```javascript
await qmsManager.assignTask('task-001', 'new-inspector@example.com');
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| taskId | `string` | Task ID |
| assignee | `string` | New assignee email |

**Returns**: `Promise<void>`

---

## Result Management Methods

### `saveResult(resultData)`

Saves a result for a completed task.

```javascript
const result = await qmsManager.saveResult({
  taskId: 'task-001',
  targetId: 'target-001',
  resultStatus: 'pass',
  passedQty: 950,
  failedQty: 50,
  failureReasons: ['dimension', 'appearance'],
  findings: 'Minor defects found in 50 units',
  actions: 'Units sent for rework'
});
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| resultData | `Object` | Result data |

**Result Data Schema**:
```typescript
interface ResultData {
  taskId: string;
  targetId: string;
  resultStatus: 'pass' | 'fail' | 'partial';
  passedQty: number;
  failedQty: number;
  failureReasons?: string[];
  findings?: string;
  actions?: string;
  photos?: string[];
}
```

**Returns**: `Promise<Object>` - Created result object with `resultId`

---

### `getResults(filters)`

Retrieves results with optional filtering.

```javascript
const results = await qmsManager.getResults({
  targetId: 'target-001',
  resultStatus: 'fail'
});
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| filters | `Object` | Filter criteria (optional) |

**Returns**: `Promise<Array<Result>>` - Array of result objects

---

### `updateResult(resultId, data)`

Updates an existing result.

```javascript
await qmsManager.updateResult('result-001', {
  actions: 'Updated action taken'
});
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| resultId | `string` | Result ID |
| data | `Object` | Fields to update |

**Returns**: `Promise<void>`

---

## Cache Management Methods

### `refreshTargetsCache()`

Refreshes the targets cache from Google Sheets.

```javascript
await qmsManager.refreshTargetsCache();
```

**Returns**: `Promise<void>`

---

### `getCachedTargets()`

Gets targets from cache without API call.

```javascript
const targets = qmsManager.getCachedTargets();
```

**Returns**: `Array<Target> | null` - Cached targets or null if cache is empty

---

### `invalidateCache(type)`

Invalidates a specific cache.

```javascript
qmsManager.invalidateCache('targets');
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| type | `string` | Cache type: 'targets', 'tasks', or 'results' |

**Returns**: `void`

---

## Synchronization Methods

### `startSync()`

Starts automatic synchronization.

```javascript
qmsManager.startSync();
```

**Returns**: `void`

**Note**: Uses `syncInterval` property for timing (default: 30 seconds)

---

### `stopSync()`

Stops automatic synchronization.

```javascript
qmsManager.stopSync();
```

**Returns**: `void`

---

### `syncNow()`

Triggers immediate synchronization.

```javascript
await qmsManager.syncNow();
```

**Returns**: `Promise<void>`

---

## Permission Methods

### `hasPermission(action)`

Checks if current user has permission for an action.

```javascript
const canCreate = qmsManager.hasPermission('create_task');
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| action | `string` | Permission action to check |

**Available Actions**:
- `read_targets`
- `write_targets`
- `delete_targets`
- `read_tasks`
- `write_tasks`
- `read_results`
- `write_results`
- `manage_users`

**Returns**: `boolean`

---

## Event Handling

### Events

The QMSManager emits custom events that can be listened to:

```javascript
// Listen for sync completion
window.addEventListener('qms:sync:complete', (event) => {
  console.log('Sync completed:', event.detail);
});

// Listen for errors
window.addEventListener('qms:error', (event) => {
  console.error('QMS Error:', event.detail.message);
});
```

**Available Events**:
| Event | Description | Detail |
|-------|-------------|--------|
| `qms:init` | QMS initialized | `{ success: boolean }` |
| `qms:auth:change` | Auth state changed | `{ user: Object \| null }` |
| `qms:sync:start` | Sync started | `{ type: string }` |
| `qms:sync:complete` | Sync completed | `{ type: string, count: number }` |
| `qms:sync:error` | Sync failed | `{ error: Error }` |
| `qms:target:created` | Target created | `{ target: Object }` |
| `qms:task:created` | Task created | `{ task: Object }` |
| `qms:result:saved` | Result saved | `{ result: Object }` |
| `qms:error` | General error | `{ message: string, code: string }` |

---

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `AUTH_EXPIRED` | Token expired, re-auth needed |
| `PERMISSION_DENIED` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Data conflict (optimistic locking) |
| `NETWORK_ERROR` | Network connectivity issue |
| `API_ERROR` | Google Sheets API error |
| `VALIDATION_ERROR` | Invalid input data |

### Error Object Structure

```typescript
interface QMSError {
  code: string;
  message: string;
  details?: object;
}
```

### Example Error Handling

```javascript
try {
  await qmsManager.createTask(taskData);
} catch (error) {
  switch (error.code) {
    case 'AUTH_REQUIRED':
      await qmsManager.signIn();
      break;
    case 'PERMISSION_DENIED':
      alert('You do not have permission to create tasks');
      break;
    case 'VALIDATION_ERROR':
      console.error('Invalid data:', error.details);
      break;
    default:
      console.error('Unexpected error:', error.message);
  }
}
```

---

## Data Schemas

### Target Schema

```typescript
interface Target {
  targetId: string;
  poNumber: string;
  article: string;
  model: string;
  factory: string;
  destination: string;
  quantity: number;
  crd: string;
  sddValue: string;
  registeredBy: string;
  registeredAt: string;
  status: 'active' | 'completed' | 'cancelled';
  notes: string;
  priority: 'high' | 'medium' | 'low';
}
```

### Task Schema

```typescript
interface Task {
  taskId: string;
  targetId: string;
  taskType: 'inspection' | 'rework' | 'custom';
  taskTitle: string;
  taskDescription: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  processStage: string;
  quantity: number;
  customFields: object;
}
```

### Result Schema

```typescript
interface Result {
  resultId: string;
  taskId: string;
  targetId: string;
  completedBy: string;
  completedAt: string;
  resultStatus: 'pass' | 'fail' | 'partial';
  passedQty: number;
  failedQty: number;
  failureReasons: string[];
  findings: string;
  actions: string;
  photos: string[];
  signature: string;
  auditTrail: object;
}
```

---

## Usage Examples

### Complete Workflow Example

```javascript
// 1. Initialize QMS
const qms = new QMSManager();
await qms.init();

// 2. Sign in
await qms.signIn();

// 3. Register a target
const target = await qms.registerTarget({
  poNumber: 'PO-2026-001',
  article: 'ART-100',
  model: 'RS-SPORT-2026',
  factory: 'A',
  destination: 'Netherlands',
  quantity: 5000,
  crd: '2026-03-01',
  sddValue: '2026-02-25',
  priority: 'high'
});

// 4. Create an inspection task
const task = await qms.createTask({
  targetId: target.targetId,
  taskType: 'inspection',
  taskTitle: 'Pre-shipment Inspection',
  assignedTo: 'inspector@factory.com',
  dueDate: '2026-02-20',
  priority: 'high'
});

// 5. Update task status to in_progress
await qms.updateTaskStatus(task.taskId, 'in_progress');

// 6. Save inspection result
const result = await qms.saveResult({
  taskId: task.taskId,
  targetId: target.targetId,
  resultStatus: 'partial',
  passedQty: 4800,
  failedQty: 200,
  failureReasons: ['stitching', 'appearance'],
  findings: 'Minor stitching defects found',
  actions: 'Sent for rework'
});

// 7. Mark task as completed
await qms.updateTaskStatus(task.taskId, 'completed');

// 8. Update target status
await qms.updateTargetStatus(target.targetId, 'completed');
```

---

**Document End**
