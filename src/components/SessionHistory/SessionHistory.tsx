import React from 'react';
import type { MethodExecutionResult, ErrorType } from '../../domain/types';
import { History, Clock, ArrowRight, Trash2, CheckCircle, XCircle } from 'lucide-react';
import './SessionHistory.css';

export interface HistoryItem {
  id: string;
  timestamp: string;
  methodId: string;
  methodName: string;
  expression: string;
  paramValues: Record<string, number>;
  tolerance: number;
  maxIterations: number;
  errorType: ErrorType;
  result: MethodExecutionResult;
}

interface SessionHistoryProps {
  history: HistoryItem[];
  activeHistoryId?: string | null;
  onSelectHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  className?: string;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  history,
  activeHistoryId,
  onSelectHistoryItem,
  onClearHistory,
  className = '',
}) => {
  if (history.length === 0) return null;

  return (
    <div className={`session-history-card glass-panel ${className}`}>
      <div className="history-header">
        <div className="history-title-group">
          <History size={16} className="history-icon" />
          <h4 className="history-title">Historial de la Sesión</h4>
          <span className="history-count-badge">{history.length} calculados</span>
        </div>

        <button
          type="button"
          className="clear-history-btn"
          onClick={onClearHistory}
          title="Borrar historial de la sesión"
        >
          <Trash2 size={13} />
          <span>Borrar Historial</span>
        </button>
      </div>

      <div className="history-items-list">
        {history.map((item) => {
          const isActive = activeHistoryId === item.id;
          return (
            <div
              key={item.id}
              className={`history-item-row ${isActive ? 'active' : ''}`}
              onClick={() => onSelectHistoryItem(item)}
            >
              <div className="item-meta">
                <span className="item-method-badge">{item.methodName}</span>
                <span className="item-time">
                  <Clock size={11} /> {item.timestamp}
                </span>
              </div>

              <div className="item-expr-row">
                <span className="item-expr">f(x) = {item.expression}</span>
              </div>

              <div className="item-result-preview">
                <span className="item-root">
                  xr ≈ {item.result.approximateRoot.toFixed(5)}
                </span>
                <span className="item-iter">({item.result.iterationsCount} iter)</span>
                {item.result.converged ? (
                  <span className="status-tag status-converged" title="Convergido">
                    <CheckCircle size={12} />
                  </span>
                ) : (
                  <span className="status-tag status-failed" title="No convergido">
                    <XCircle size={12} />
                  </span>
                )}
                <ArrowRight size={14} className="item-arrow" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
