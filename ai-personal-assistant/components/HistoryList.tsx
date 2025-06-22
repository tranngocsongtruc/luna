import React from 'react';
import { HistoryItemType } from '../types';
import { format } from 'date-fns';
import { MarkdownRenderer } from './MarkdownRenderer'; // Assuming MarkdownRenderer is general enough

interface HistoryListProps<T extends HistoryItemType> {
  items: T[];
  onDeleteItem: (id: string) => void;
  title: string;
  renderItemPreview: (item: T) => React.ReactNode;
  noItemsMessage?: string;
}

export const HistoryList = <T extends HistoryItemType>({
  items,
  onDeleteItem,
  title,
  renderItemPreview,
  noItemsMessage = "No history yet."
}: HistoryListProps<T>) => {
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-sky-400 mb-3">{title}</h3>
        <p className="text-slate-400">{noItemsMessage}</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-sky-400 mb-3">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="bg-slate-700/50 p-4 rounded-md shadow">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="text-md font-semibold text-sky-300 hover:text-sky-200 focus:outline-none w-full text-left"
                  aria-expanded={expandedItem === item.id}
                  aria-controls={`history-item-details-${item.id}`}
                >
                  {renderItemPreview(item)}
                </button>
                <p className="text-xs text-slate-400 mt-1">
                  {format(new Date(item.timestamp), "MMM d, yyyy 'at' HH:mm:ss")}
                </p>
              </div>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="text-red-400 hover:text-red-300 ml-4 p-1 rounded hover:bg-red-700/50 transition-colors"
                aria-label={`Delete history item from ${format(new Date(item.timestamp), "MMM d, yyyy")}`}
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
            {expandedItem === item.id && (
              <div id={`history-item-details-${item.id}`} className="mt-3 pt-3 border-t border-slate-600">
                 {/* This part needs to be customized based on item type in the feature component */}
                 { 'organizedNote' in item && <MarkdownRenderer content={item.organizedNote} /> }
                 { 'resources' in item && <MarkdownRenderer content={item.resources} /> }
                 { 'answer' in item && <MarkdownRenderer content={item.answer} /> }
                 { 'generatedSchedule' in item && <MarkdownRenderer content={item.generatedSchedule} /> }
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
