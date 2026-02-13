/**
 * @fileoverview Glossary Tooltip Component
 * Provides inline term explanations for domain-specific abbreviations.
 *
 * @module components/common/GlossaryTooltip
 */

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Glossary terms with translations
 */
const GLOSSARY_TERMS = {
  // Date-related
  crd: {
    abbr: 'CRD',
    full: { ko: 'Customer Required Date', en: 'Customer Required Date', vi: 'Ngày yêu cầu của khách hàng' },
    desc: {
      ko: '고객이 요청한 납기일. 이 날짜까지 고객에게 제품이 도착해야 합니다.',
      en: 'The date by which the customer needs to receive the product.',
      vi: 'Ngày mà khách hàng cần nhận sản phẩm.'
    }
  },
  sdd: {
    abbr: 'SDD',
    full: { ko: 'Scheduled Delivery Date', en: 'Scheduled Delivery Date', vi: 'Ngày giao hàng dự kiến' },
    desc: {
      ko: '공장에서 계획한 출고 예정일. SDD > CRD이면 지연으로 판정합니다.',
      en: 'The planned shipping date from the factory. If SDD > CRD, the order is considered delayed.',
      vi: 'Ngày giao hàng dự kiến từ nhà máy. Nếu SDD > CRD, đơn hàng được coi là bị trễ.'
    }
  },

  // Order-related
  po: {
    abbr: 'PO#',
    full: { ko: 'Purchase Order Number', en: 'Purchase Order Number', vi: 'Số đơn đặt hàng' },
    desc: {
      ko: '구매 주문 번호. 각 주문을 고유하게 식별하는 코드입니다.',
      en: 'A unique identifier for each purchase order.',
      vi: 'Mã nhận dạng duy nhất cho mỗi đơn đặt hàng.'
    }
  },
  code04: {
    abbr: 'Code04',
    full: { ko: 'SDD 변경 승인', en: 'SDD Change Approval', vi: 'Phê duyệt thay đổi SDD' },
    desc: {
      ko: 'SDD 변경이 공식 승인된 상태. 지연으로 집계되지 않습니다.',
      en: 'Official approval for SDD change. Not counted as delayed.',
      vi: 'Phê duyệt chính thức cho việc thay đổi SDD. Không được tính là trễ.'
    }
  },

  // Process-related
  wh_in: {
    abbr: 'WH_IN',
    full: { ko: 'Warehouse In', en: 'Warehouse In', vi: 'Nhập kho' },
    desc: {
      ko: '제품창고 입고. 완제품이 제품창고에 입고된 수량입니다.',
      en: 'Quantity of finished goods received into warehouse.',
      vi: 'Số lượng thành phẩm nhập vào kho.'
    }
  },
  wh_out: {
    abbr: 'WH_OUT',
    full: { ko: 'Warehouse Out', en: 'Warehouse Out', vi: 'Xuất kho' },
    desc: {
      ko: '제품창고 출고. 고객에게 출하된 수량입니다.',
      en: 'Quantity shipped to customer from warehouse.',
      vi: 'Số lượng đã xuất cho khách hàng từ kho.'
    }
  },

  // Status-related
  delayed: {
    abbr: '지연',
    full: { ko: '지연 주문', en: 'Delayed Order', vi: 'Đơn hàng bị trễ' },
    desc: {
      ko: 'SDD가 CRD를 초과한 주문. 즉시 조치가 필요합니다.',
      en: 'Orders where SDD exceeds CRD. Immediate action required.',
      vi: 'Đơn hàng có SDD vượt quá CRD. Cần hành động ngay.'
    }
  },
  warning: {
    abbr: '경고',
    full: { ko: '경고 주문', en: 'Warning Order', vi: 'Đơn hàng cảnh báo' },
    desc: {
      ko: 'CRD까지 3일 이내 남은 주문. 우선 처리가 필요합니다.',
      en: 'Orders with less than 3 days until CRD. Priority handling needed.',
      vi: 'Đơn hàng còn ít hơn 3 ngày đến CRD. Cần xử lý ưu tiên.'
    }
  },

  // KPI Metrics
  completion_rate: {
    abbr: '완료율',
    full: { ko: '생산 완료율', en: 'Completion Rate', vi: 'Tỷ lệ hoàn thành' },
    desc: {
      ko: '총 오더 중 WH_IN(입고) 완료된 오더의 비율입니다.',
      en: 'Percentage of orders that have completed warehouse intake.',
      vi: 'Tỷ lệ phần trăm đơn hàng đã hoàn thành nhập kho.'
    }
  },
  shipped_rate: {
    abbr: '출고율',
    full: { ko: '선적 출고율', en: 'Shipped Rate', vi: 'Tỷ lệ xuất hàng' },
    desc: {
      ko: '총 오더 중 WH_OUT(출고) 완료된 오더의 비율입니다.',
      en: 'Percentage of orders that have been shipped from warehouse.',
      vi: 'Tỷ lệ phần trăm đơn hàng đã xuất kho.'
    }
  },
  delay_rate: {
    abbr: '지연율',
    full: { ko: '지연 발생률', en: 'Delay Rate', vi: 'Tỷ lệ trễ' },
    desc: {
      ko: '총 오더 중 SDD > CRD인 지연 오더의 비율입니다.',
      en: 'Percentage of orders where scheduled date exceeds customer required date.',
      vi: 'Tỷ lệ phần trăm đơn hàng có ngày dự kiến vượt quá ngày khách hàng yêu cầu.'
    }
  },
  total_orders: {
    abbr: '총 오더',
    full: { ko: '총 오더 수', en: 'Total Orders', vi: 'Tổng số đơn hàng' },
    desc: {
      ko: '선택된 필터 조건에 해당하는 전체 주문 건수입니다.',
      en: 'Total number of orders matching the selected filter criteria.',
      vi: 'Tổng số đơn hàng phù hợp với tiêu chí lọc đã chọn.'
    }
  },
  total_quantity: {
    abbr: '총 수량',
    full: { ko: '총 주문 수량', en: 'Total Quantity', vi: 'Tổng số lượng' },
    desc: {
      ko: '선택된 필터 조건에 해당하는 전체 제품 수량(pcs)입니다.',
      en: 'Total quantity of products matching the selected filter criteria.',
      vi: 'Tổng số lượng sản phẩm phù hợp với tiêu chí lọc đã chọn.'
    }
  },
  in_progress: {
    abbr: '진행 중',
    full: { ko: '생산 진행 중', en: 'In Progress', vi: 'Đang xử lý' },
    desc: {
      ko: '재단부터 입고 전까지의 공정에 있는 오더입니다.',
      en: 'Orders currently in production stages between cutting and warehouse intake.',
      vi: 'Đơn hàng đang trong giai đoạn sản xuất từ cắt đến nhập kho.'
    }
  },

  // Urgency Levels
  urgency_critical: {
    abbr: '긴급',
    full: { ko: '긴급 (D-day)', en: 'Critical', vi: 'Khẩn cấp' },
    desc: {
      ko: 'CRD가 오늘이거나 이미 지났습니다. 즉시 조치가 필요합니다.',
      en: 'CRD is today or already passed. Immediate action required.',
      vi: 'CRD là hôm nay hoặc đã qua. Cần hành động ngay.'
    }
  },
  urgency_high: {
    abbr: '높음',
    full: { ko: '긴급도 높음', en: 'High Urgency', vi: 'Độ khẩn cấp cao' },
    desc: {
      ko: 'CRD까지 3일 이내입니다. 우선 처리가 필요합니다.',
      en: 'Less than 3 days until CRD. Priority handling needed.',
      vi: 'Còn ít hơn 3 ngày đến CRD. Cần xử lý ưu tiên.'
    }
  },
  urgency_medium: {
    abbr: '보통',
    full: { ko: '긴급도 보통', en: 'Medium Urgency', vi: 'Độ khẩn cấp trung bình' },
    desc: {
      ko: 'CRD까지 7일 이내입니다. 진행 상황을 모니터링하세요.',
      en: 'Less than 7 days until CRD. Monitor progress.',
      vi: 'Còn ít hơn 7 ngày đến CRD. Theo dõi tiến độ.'
    }
  }
};

/**
 * GlossaryTooltip Component
 * @param {Object} props
 * @param {string} props.term - Term key from GLOSSARY_TERMS
 * @param {React.ReactNode} props.children - Content to wrap
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showIcon - Show help icon (default: true)
 */
export default function GlossaryTooltip({
  term,
  children,
  className = '',
  showIcon = true
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.language || 'ko';

  const termData = GLOSSARY_TERMS[term?.toLowerCase()];

  if (!termData) {
    return <span className={className}>{children}</span>;
  }

  const fullName = termData.full[lang] || termData.full.ko;
  const description = termData.desc[lang] || termData.desc.ko;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {children}
      {showIcon && (
        <span className="relative">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
            aria-label={`${termData.abbr} 설명`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {showTooltip && (
            <span className="absolute z-50 left-0 top-full mt-1 w-56 p-3 text-xs bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg">
              <span className="block font-bold text-blue-300 mb-1">
                {termData.abbr} - {fullName}
              </span>
              <span className="block text-gray-200">
                {description}
              </span>
              <span className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
            </span>
          )}
        </span>
      )}
    </span>
  );
}

/**
 * Get term description for use outside component
 * @param {string} term - Term key
 * @param {string} lang - Language code
 * @returns {Object|null} Term data
 */
export function getGlossaryTerm(term, lang = 'ko') {
  const termData = GLOSSARY_TERMS[term?.toLowerCase()];
  if (!termData) return null;

  return {
    abbr: termData.abbr,
    full: termData.full[lang] || termData.full.ko,
    desc: termData.desc[lang] || termData.desc.ko
  };
}

/**
 * Export glossary terms for reference
 */
export { GLOSSARY_TERMS };
