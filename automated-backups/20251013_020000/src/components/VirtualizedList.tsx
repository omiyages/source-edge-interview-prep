import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length - 1
    );
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: endIndex,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Specialized virtualized Kanban column
interface VirtualizedKanbanColumnProps {
  column: {
    id: string;
    title: string;
    users: any[];
  };
  onUserClick: (user: any) => void;
  onRejectUser: (userId: string, email: string) => void;
  onEditUser: (user: any) => void;
  itemHeight?: number;
  maxHeight?: number;
}

export function VirtualizedKanbanColumn({
  column,
  onUserClick,
  onRejectUser,
  onEditUser,
  itemHeight = 120,
  maxHeight = 600,
}: VirtualizedKanbanColumnProps) {
  const renderUser = (user: any, index: number) => (
    <div
      key={user.user_id}
      className="p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
      onClick={() => onUserClick(user)}
    >
      <div className="bg-white border rounded-lg p-3 shadow-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {user.full_name}
            </h4>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <div className="flex gap-1">
            <button
              className="p-1 text-gray-400 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                onEditUser(user);
              }}
            >
              ✏️
            </button>
            <button
              className="p-1 text-gray-400 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onRejectUser(user.user_id, user.email);
              }}
            >
              ❌
            </button>
          </div>
        </div>

        {user.position && (
          <div className="text-xs text-gray-500 mb-2">
            {user.position}
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-2">
          {user.incomplete_tasks_count && user.incomplete_tasks_count > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {user.incomplete_tasks_count}
            </span>
          )}
          {user.upcoming_interview_name && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {user.upcoming_interview_name}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-400">
          Updated {new Date(user.last_updated_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <div className="p-3 border-b">
        <h3 className="font-medium text-sm">{column.title}</h3>
        <span className="text-xs text-gray-500">{column.users.length} users</span>
      </div>
      
      {column.users.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No users in this stage
        </div>
      ) : (
        <VirtualizedList
          items={column.users}
          itemHeight={itemHeight}
          containerHeight={maxHeight}
          renderItem={renderUser}
          className="p-2"
        />
      )}
    </div>
  );
}
