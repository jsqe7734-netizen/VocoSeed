import { useState, useRef, useEffect } from 'react';
import { FileText, File, X, Check } from 'lucide-react';
import type { Idea } from '../data/types';
import { exportIdeaAsMarkdown, exportIdeaAsText } from '../services/exportService';

interface ExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea;
  trigger: React.ReactNode;
}

export default function ExportMenu({ isOpen, onClose, idea, trigger }: ExportMenuProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleExport = async (format: 'markdown' | 'text') => {
    try {
      if (format === 'markdown') {
        exportIdeaAsMarkdown(idea);
      } else {
        exportIdeaAsText(idea);
      }
      setExportFormat(format);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setExportFormat(null);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {trigger}
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">导出创意</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{idea.title}</p>
          </div>
          
          <div className="p-2">
            <button
              onClick={() => handleExport('markdown')}
              disabled={showSuccess}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group disabled:opacity-50"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                {showSuccess && exportFormat === 'markdown' ? (
                  <Check size={16} className="text-blue-600" />
                ) : (
                  <FileText size={16} className="text-blue-600" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">Markdown</p>
                <p className="text-xs text-gray-500">适合分享和文档</p>
              </div>
            </button>
            
            <button
              onClick={() => handleExport('text')}
              disabled={showSuccess}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group disabled:opacity-50"
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                {showSuccess && exportFormat === 'text' ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <File size={16} className="text-green-600" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">纯文本</p>
                <p className="text-xs text-gray-500">简单通用格式</p>
              </div>
            </button>
          </div>
          
          <div className="p-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={14} />
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
