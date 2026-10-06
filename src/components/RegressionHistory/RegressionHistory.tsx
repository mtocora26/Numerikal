import React from 'react';
import { History, Clock, ArrowRight, Trash2 } from 'lucide-react';
import type { RegressionResult } from '../../domain/regression/types';
import type { DataRow } from '../DataPointsInput/DataPointsInput';
import '../SessionHistory/SessionHistory.css';

export interface RegressionHistoryItem {
  id: string;
  timestamp: string;
  methodId: string;
  methodName: string;
  rows: DataRow[];
  degree: number;
  result: RegressionResult;
}

interface RegressionHistoryProps {
  history: RegressionHistoryItem[];
  activeHistoryId?: string | null;
  onSelectHistoryItem: (item: RegressionHistoryItem) => void;
  onClearHistory: () => void;
}

export const RegressionHistory: React.FC<RegressionHistoryProps> = ({
  history,
  activeHistoryId,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="session-history-card glass-panel">
      <div className="history-header">
        <div className="history-title-group">
          <History size={16} className="history-icon" />
          <h4 className="history-title">Historial de la Sesión</h4>
          <span className="history-count-badge">{history.length} calculados</span>
        </div>
        <button type="button" className="clear-history-btn" onClick={onClearHistory} title="Borrar historial de la sesión">
          <Trash2 size={13} />
          <span>Borrar Historial</span>
        </button>
      </div>

      <div className="history-items-list">
        {history.map((item) => (
          <div
            key={item.id}
            className={`history-item-row ${activeHistoryId === item.id ? 'active' : ''}`}
            onClick={() => onSelectHistoryItem(item)}
          >
            <div className="item-meta">
              <span className="item-method-badge">{item.methodName} · grado {item.degree}</span>
              <span className="item-time"><Clock size={11} /> {item.timestamp}</span>
            </div>
            <div className="item-expr-row">
              <span className="item-expr">{item.result.n} datos</span>
            </div>
            <div className="item-result-preview">
              <span className="item-root">R² = {item.result.r2.toFixed(5)}</span>
              <ArrowRight size={14} className="item-arrow" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
