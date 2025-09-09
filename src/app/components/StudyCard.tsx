'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StudyLog {
  date: string;
  title: string;
  summary: string;
  details: string;
  icon: string;
}

interface StudyCardProps {
  log: StudyLog;
  index: number;
}

export default function StudyCard({ log, index }: StudyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative flex items-start gap-6 group"
    >
      {/* Timeline line and icon */}
      <div className="flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 dark:from-gray-100 dark:to-gray-300 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-700 text-xl shadow-lg group-hover:shadow-xl transition-all duration-300 z-10 border border-gray-200 dark:border-gray-400 select-none font-default"
        >
          {log.icon}
        </motion.div>
      </div>

      {/* Card content */}
      <motion.div
        whileHover={{ x: 10 }}
        className="flex-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{formatDate(log.date)}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{log.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{log.summary}</p>
            </div>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }} className="ml-4 text-gray-400 dark:text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{log.details}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
