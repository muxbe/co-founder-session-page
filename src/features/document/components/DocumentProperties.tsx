'use client';

interface DocumentPropertiesProps {
  currentDate?: string;
  status: string;
}

/**
 * Get status text in Georgian based on session status
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'ready':
      return 'მზადაა';
    case 'chatting':
      return 'სამუშაოში';
    case 'analyzing':
      return 'ანალიზდება';
    case 'complete':
      return 'დასრულებული';
    default:
      return 'მიმდინარეობს';
  }
}

/**
 * Document Properties Component
 * Shows metadata like creation date, author, and status
 */
export function DocumentProperties({ currentDate, status }: DocumentPropertiesProps) {
  return (
    <div className="notion-properties">
      <div className="property-row">
        <div className="property-label">📅 შექმნილია</div>
        <div className="property-value">{currentDate || 'იტვირთება...'}</div>
      </div>
      <div className="property-row">
        <div className="property-label">👤 ავტორი</div>
        <div className="property-value">გიორგი</div>
      </div>
      <div className="property-row">
        <div className="property-label">🏷 სტატუსი</div>
        <div className="property-value">
          <span className="status-pill">{getStatusText(status)}</span>
        </div>
      </div>
    </div>
  );
}
