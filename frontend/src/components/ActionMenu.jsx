import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';

export const ActionMenu = ({ items = [], align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 148;
    const left = align === 'right' ? Math.max(8, rect.right - menuWidth) : rect.left;

    // Check if dropdown goes below viewport
    const menuHeight = items.filter(i => !i.hidden).length * 36 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuHeight && rect.top > menuHeight;
    const top = openUpwards ? Math.max(8, rect.top - menuHeight - 4) : (rect.bottom + 4);

    setCoords({ top, left });
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleScrollOrResize = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className={`p-1.5 rounded-lg transition active:scale-95 focus:outline-none border ${
          isOpen
            ? 'bg-slate-200 text-slate-900 border-slate-300'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200'
        }`}
        title="Actions"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
              width: '148px',
            }}
            className="bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item, idx) => {
              if (item.hidden) return null;

              const Icon = item.icon;
              const content = (
                <span className="flex items-center gap-2.5 w-full">
                  {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor || 'text-slate-500'}`} />}
                  <span className="truncate font-semibold">{item.label}</span>
                </span>
              );

              if (item.to) {
                return (
                  <Link
                    key={idx}
                    to={item.to}
                    onClick={(e) => {
                      if (item.onClick) item.onClick(e);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center transition hover:bg-slate-50 ${
                      item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:text-blue-700'
                    }`}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    if (item.onClick) item.onClick();
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center transition hover:bg-slate-50 ${
                    item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:text-blue-700'
                  }`}
                >
                  {content}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ActionMenu;
