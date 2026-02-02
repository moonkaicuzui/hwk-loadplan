/**
 * ExportView.js - Export View Layer Module
 * =========================================
 *
 * Handles all export functionality including Excel, CSV, PDF, and HTML reports.
 * Uses dependency injection pattern for external libraries and utilities.
 *
 * Features:
 * - Excel export (single sheet and multi-sheet by month/factory)
 * - CSV export with UTF-8 BOM for Korean Excel compatibility
 * - PDF export with styled tables using jsPDF autoTable
 * - Standalone HTML report download
 * - Chunk processing for large datasets (>1000 rows)
 *
 * @module views/ExportView
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 2
 * @version 19.0.0
 */

// ============================================================================
// Module State (injected from main dashboard)
// ============================================================================

/** @type {Object|null} XLSX library instance (SheetJS) */
let XLSX = null;

/** @type {Object|null} jsPDF library instance */
let jspdf = null;

/** @type {Function|null} ChunkProcessor class for large data handling */
let ChunkProcessor = null;

/** @type {Function|null} Function to get export-ready data */
let prepareExportData = null;

/** @type {Function|null} Show chunk progress UI */
let showChunkProgress = null;

/** @type {Function|null} Update chunk progress UI */
let updateChunkProgress = null;

/** @type {Function|null} Hide chunk progress UI */
let hideChunkProgress = null;

/** @type {Function|null} Format number for display */
let formatNumber = null;

/** @type {Function|null} Get filtered data array */
let getFilteredData = null;

/** @type {Object} Logger object */
let log = {
  info: console.log,
  debug: console.debug,
  warn: console.warn,
  error: console.error,
};

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize ExportView with dependencies
 *
 * @param {Object} dependencies - External dependencies
 * @param {Object} [dependencies.XLSX] - SheetJS library for Excel
 * @param {Object} [dependencies.jspdf] - jsPDF library for PDF
 * @param {Function} [dependencies.ChunkProcessor] - Chunk processor class
 * @param {Function} [dependencies.prepareExportData] - Data preparation function
 * @param {Function} [dependencies.showChunkProgress] - Progress show function
 * @param {Function} [dependencies.updateChunkProgress] - Progress update function
 * @param {Function} [dependencies.hideChunkProgress] - Progress hide function
 * @param {Function} [dependencies.formatNumber] - Number formatting function
 * @param {Function} [dependencies.getFilteredData] - Get filtered data function
 * @param {Object} [dependencies.log] - Logger object
 */
export function initExportView(dependencies) {
  if (dependencies.XLSX) XLSX = dependencies.XLSX;
  if (dependencies.jspdf) jspdf = dependencies.jspdf;
  if (dependencies.ChunkProcessor) ChunkProcessor = dependencies.ChunkProcessor;
  if (dependencies.prepareExportData) prepareExportData = dependencies.prepareExportData;
  if (dependencies.showChunkProgress) showChunkProgress = dependencies.showChunkProgress;
  if (dependencies.updateChunkProgress) updateChunkProgress = dependencies.updateChunkProgress;
  if (dependencies.hideChunkProgress) hideChunkProgress = dependencies.hideChunkProgress;
  if (dependencies.formatNumber) formatNumber = dependencies.formatNumber;
  if (dependencies.getFilteredData) getFilteredData = dependencies.getFilteredData;
  if (dependencies.log) log = dependencies.log;

  log.info('[ExportView] Initialized with dependencies');
}

// ============================================================================
// HTML Report Export
// ============================================================================

/**
 * Download daily report as standalone HTML file
 * Creates a self-contained HTML with inline CSS for offline viewing
 *
 * @returns {void}
 */
export function downloadReportHTML() {
  const today = new Date().toISOString().slice(0, 10);
  const reportContentEl = document.getElementById('reportContent');

  if (!reportContentEl) {
    log.error('[ExportView] Report content element not found');
    return;
  }

  const reportContent = reportContentEl.innerHTML;

  // 독립적인 HTML 파일 생성 (외부 의존성 없음)
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rachgia 일일 보고서 - ${today}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
        .report-section { margin-bottom: 30px; page-break-inside: avoid; }
        .report-section h3 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .progress-bar { background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden; }
        .progress-fill { background: #3b82f6; height: 100%; }
        .status-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-pending { background: #fee2e2; color: #991b1b; }
        @media print { body { padding: 0; } .report-section { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <h1 style="margin-bottom: 30px;">📊 Rachgia 일일 생산 현황 보고서 (${today})</h1>
    ${reportContent}
    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>Generated: ${new Date().toLocaleString('ko-KR')}</p>
        <p>Rachgia Factory Dashboard v18</p>
    </footer>
</body>
</html>`;

  // Blob 생성 및 다운로드
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rachgia_Daily_Report_${today}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  log.info(`[ExportView] HTML report downloaded: Rachgia_Daily_Report_${today}.html`);
}

// ============================================================================
// Excel Export (Single Sheet)
// ============================================================================

/**
 * Export filtered data to Excel (single sheet)
 * Uses chunk processing for large datasets (>1000 rows)
 *
 * @returns {void}
 */
export function exportToExcel() {
  if (!XLSX) {
    log.error('[ExportView] XLSX library not available');
    alert('Excel 내보내기 기능을 사용할 수 없습니다.');
    return;
  }

  const exportData = prepareExportData ? prepareExportData() : [];
  if (exportData.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  log.info(`[ExportView] Exporting ${exportData.length} rows to Excel`);

  // 대용량 데이터 처리
  if (
    exportData.length > 1000 &&
    ChunkProcessor &&
    showChunkProgress &&
    updateChunkProgress &&
    hideChunkProgress
  ) {
    showChunkProgress('Excel 내보내기 준비 중...');

    const processor = new ChunkProcessor(exportData, {
      chunkSize: 500,
      delayMs: 10,
      onProgress: (processed, total) => {
        updateChunkProgress(Math.round((processed / total) * 100));
      },
      onComplete: results => {
        hideChunkProgress();
        createAndDownloadExcel(results);
      },
    });

    processor.process(item => item);
  } else {
    createAndDownloadExcel(exportData);
  }
}

/**
 * Create and download Excel file from data
 *
 * @param {Array<Object>} data - Data to export
 * @private
 */
function createAndDownloadExcel(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');

  // 컬럼 너비 자동 조정
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, 15),
  }));
  ws['!cols'] = colWidths;

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Rachgia_Orders_${today}.xlsx`);

  log.info(`[ExportView] Excel file created: Rachgia_Orders_${today}.xlsx`);
}

// ============================================================================
// Excel Export (Multi-Sheet)
// ============================================================================

/**
 * Export filtered data to Excel with multiple sheets
 * Groups data by month or factory
 *
 * @param {string} groupBy - Grouping method: 'month' or 'factory'
 * @returns {void}
 */
export function exportToExcelMultiSheet(groupBy = 'month') {
  if (!XLSX) {
    log.error('[ExportView] XLSX library not available');
    alert('Excel 내보내기 기능을 사용할 수 없습니다.');
    return;
  }

  const exportData = prepareExportData ? prepareExportData() : [];
  if (exportData.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  log.info(
    `[ExportView] Exporting ${exportData.length} rows to multi-sheet Excel (groupBy: ${groupBy})`
  );

  const wb = XLSX.utils.book_new();

  // 데이터 그룹화
  const groups = {};
  exportData.forEach(item => {
    let key;
    if (groupBy === 'month') {
      key = item['CRD'] ? item['CRD'].substring(0, 7) : 'Unknown';
    } else if (groupBy === 'factory') {
      key = item['Factory'] || 'Unknown';
    } else {
      key = 'All';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  // 각 그룹별 시트 생성
  const sortedKeys = Object.keys(groups).sort();
  sortedKeys.forEach(key => {
    const sheetData = groups[key];
    const ws = XLSX.utils.json_to_sheet(sheetData);

    // 컬럼 너비 자동 조정
    const colWidths = Object.keys(sheetData[0] || {}).map(colKey => ({
      wch: Math.max(colKey.length, 15),
    }));
    ws['!cols'] = colWidths;

    // 시트 이름 정리 (Excel 시트 이름 규칙: 31자 이하, 특수문자 제한)
    const sheetName = key.replace(/[\\\/\*\?\[\]:]/g, '_').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // 요약 시트 추가
  const summaryData = sortedKeys.map(key => ({
    [groupBy === 'month' ? 'Month' : 'Factory']: key,
    'Total Orders': groups[key].length,
    'Total Quantity': groups[key].reduce((sum, item) => sum + (parseInt(item['Quantity']) || 0), 0),
  }));

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  const today = new Date().toISOString().slice(0, 10);
  const filename = `Rachgia_Orders_by_${groupBy}_${today}.xlsx`;
  XLSX.writeFile(wb, filename);

  log.info(`[ExportView] Multi-sheet Excel file created: ${filename}`);
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Export filtered data to CSV format
 * Includes UTF-8 BOM for Korean text compatibility in Excel
 *
 * @returns {void}
 */
export function exportToCSV() {
  const exportData = prepareExportData ? prepareExportData() : [];
  if (exportData.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  log.info(`[ExportView] Exporting ${exportData.length} rows to CSV`);

  // 헤더 추출
  const headers = Object.keys(exportData[0]);

  // CSV 문자열 생성
  const csvRows = [];

  // 헤더 행
  csvRows.push(headers.map(header => `"${header}"`).join(','));

  // 데이터 행
  exportData.forEach(item => {
    const row = headers.map(header => {
      let value = item[header];
      if (value === null || value === undefined) {
        value = '';
      }
      // 쉼표, 따옴표, 줄바꿈이 포함된 값 처리
      value = String(value).replace(/"/g, '""');
      return `"${value}"`;
    });
    csvRows.push(row.join(','));
  });

  // UTF-8 BOM 추가 (한글 엑셀 호환성)
  const BOM = '\uFEFF';
  const csvContent = BOM + csvRows.join('\n');

  // Blob 생성 및 다운로드
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const today = new Date().toISOString().slice(0, 10);
  a.download = `Rachgia_Orders_${today}.csv`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  log.info(`[ExportView] CSV file created: Rachgia_Orders_${today}.csv`);
}

// ============================================================================
// PDF Export
// ============================================================================

/**
 * Export filtered data to PDF format
 * Uses jsPDF with autoTable plugin for styled tables
 *
 * @returns {void}
 */
export function exportToPDF() {
  if (!jspdf || !jspdf.jsPDF) {
    log.error('[ExportView] jsPDF library not available');
    alert('PDF 내보내기 기능을 사용할 수 없습니다.');
    return;
  }

  const exportData = prepareExportData ? prepareExportData() : [];
  if (exportData.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  log.info(`[ExportView] Exporting ${exportData.length} rows to PDF`);

  const { jsPDF } = jspdf;
  const doc = new jsPDF('landscape', 'mm', 'a4');

  const today = new Date().toISOString().slice(0, 10);

  // 제목
  doc.setFontSize(16);
  doc.text('Rachgia Factory Production Report', 14, 15);

  // 날짜
  doc.setFontSize(10);
  doc.text(`Generated: ${today}`, 14, 22);

  // 필터 정보
  const filterInfo = getFilterInfo();
  doc.setFontSize(9);
  doc.text(`Filters: ${filterInfo}`, 14, 28);

  // 요약 통계
  const filteredData = getFilteredData ? getFilteredData() : [];
  const stats = calculateExportStats(filteredData);
  doc.text(
    `Total: ${formatNumber ? formatNumber(stats.totalOrders) : stats.totalOrders} orders | ` +
      `Quantity: ${formatNumber ? formatNumber(stats.totalQuantity) : stats.totalQuantity} | ` +
      `Delayed: ${stats.delayedOrders} | ` +
      `Completion: ${stats.completionRate}%`,
    14,
    34
  );

  // 테이블 헤더 정의 (축약된 컬럼)
  const tableHeaders = ['Factory', 'PO', 'Model', 'Dest', 'Qty', 'CRD', 'SDD', 'Status'];

  // 테이블 데이터 (최대 500행)
  const maxRows = 500;
  const tableData = exportData
    .slice(0, maxRows)
    .map(item => [
      item['Factory'] || '',
      (item['PO'] || '').substring(0, 12),
      (item['Model'] || '').substring(0, 15),
      (item['Destination'] || '').substring(0, 12),
      item['Quantity'] || '',
      item['CRD'] || '',
      item['SDD'] || '',
      item['WH_OUT Status'] || '',
    ]);

  // autoTable로 테이블 생성
  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 15 }, // Factory
      1: { cellWidth: 25 }, // PO
      2: { cellWidth: 35 }, // Model
      3: { cellWidth: 25 }, // Dest
      4: { cellWidth: 15, halign: 'right' }, // Qty
      5: { cellWidth: 22 }, // CRD
      6: { cellWidth: 22 }, // SDD
      7: { cellWidth: 20 }, // Status
    },
  });

  // 행 수 제한 표시
  if (exportData.length > maxRows) {
    const finalY = doc.lastAutoTable.finalY || 200;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `* Showing first ${maxRows} of ${exportData.length} records. Use Excel export for full data.`,
      14,
      finalY + 10
    );
  }

  // 저장
  doc.save(`Rachgia_Orders_${today}.pdf`);

  log.info(`[ExportView] PDF file created: Rachgia_Orders_${today}.pdf`);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current filter information as string
 *
 * @returns {string} Filter description
 * @private
 */
function getFilterInfo() {
  const filters = [];

  const monthEl = document.getElementById('monthFilter');
  const destEl = document.getElementById('destFilter');
  const vendorEl = document.getElementById('vendorFilter');
  const statusEl = document.getElementById('statusFilter');
  const factoryEl = document.getElementById('factoryFilter');

  if (monthEl && monthEl.value && monthEl.value !== 'all') {
    filters.push(`Month: ${monthEl.value}`);
  }
  if (destEl && destEl.value && destEl.value !== 'all') {
    filters.push(`Dest: ${destEl.value}`);
  }
  if (vendorEl && vendorEl.value && vendorEl.value !== 'all') {
    filters.push(`Vendor: ${vendorEl.value}`);
  }
  if (statusEl && statusEl.value && statusEl.value !== 'all') {
    filters.push(`Status: ${statusEl.value}`);
  }
  if (factoryEl && factoryEl.value && factoryEl.value !== 'all') {
    filters.push(`Factory: ${factoryEl.value}`);
  }

  return filters.length > 0 ? filters.join(', ') : 'All data';
}

/**
 * Calculate statistics for export
 *
 * @param {Array<Object>} data - Data array
 * @returns {Object} Statistics object
 * @private
 */
function calculateExportStats(data) {
  if (!data || data.length === 0) {
    return {
      totalOrders: 0,
      totalQuantity: 0,
      delayedOrders: 0,
      completionRate: 0,
    };
  }

  const totalOrders = data.length;
  const totalQuantity = data.reduce((sum, d) => sum + (d.quantity || 0), 0);

  let delayedOrders = 0;
  let completedOrders = 0;

  data.forEach(d => {
    // Check delayed status
    if (d.sddValue && d.crd) {
      const sdd = new Date(d.sddValue);
      const crd = new Date(d.crd);
      if (sdd > crd && !(d.code04 && d.code04.toLowerCase().includes('approval'))) {
        delayedOrders++;
      }
    }

    // Check completion status
    if (d.production && d.production.wh_out && d.production.wh_out.status === 'completed') {
      completedOrders++;
    }
  });

  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  return {
    totalOrders,
    totalQuantity,
    delayedOrders,
    completionRate,
  };
}

// ============================================================================
// Module Exports Summary
// ============================================================================
/**
 * Total Exports: 6
 *
 * - initExportView(dependencies) - Initialize module with dependencies
 * - downloadReportHTML() - Download daily report as HTML
 * - exportToExcel() - Export to Excel (single sheet)
 * - exportToExcelMultiSheet(groupBy) - Export to Excel (multi-sheet)
 * - exportToCSV() - Export to CSV
 * - exportToPDF() - Export to PDF
 */
