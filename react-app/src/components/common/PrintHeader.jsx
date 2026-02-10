/**
 * @fileoverview Print Header Component
 * Shows title and date when printing, hidden on screen.
 *
 * @module components/common/PrintHeader
 */

/**
 * PrintHeader - Shows only when printing
 * @param {Object} props
 * @param {string} props.title - Document title
 * @param {string} props.subtitle - Optional subtitle
 */
export function PrintHeader({ title, subtitle }) {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="hidden print:block print-header">
      <h1>{title}</h1>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      <p className="print-date">출력일: {today}</p>
    </div>
  );
}

/**
 * PrintFooter - Shows page info when printing
 */
export function PrintFooter() {
  return (
    <div className="hidden print:block print-footer">
      Rachgia Factory Dashboard - Confidential
    </div>
  );
}

export default PrintHeader;
