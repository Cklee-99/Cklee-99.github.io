'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StudyCard, { StudyLog } from './StudyCard';

export default function Timeline() {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/data/logs.json');
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data = await response.json();
        const sortedData = data.sort((a: StudyLog, b: StudyLog) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLogs(sortedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-2xl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-white">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-2xl">
        <div className="mb-2">⚠️</div>
        <p className="text-white">Failed to load: {error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
        <p className="text-gray-600 dark:text-gray-400">No study logs yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-12 select-none"
      >
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-4xl font-bold text-white mb-4 drop-shadow-lg"
        >
          Study Log
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-gray-300 drop-shadow-md"
        >
          Recording my learning journey and growth
        </motion.p>
      </motion.div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-400 via-orange-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 to-purple-400"></div>

        {/* Timeline items */}
        <div className="space-y-8">
          {logs.map((log, index) => (
            <StudyCard key={`${log.date}-${index}`} log={log} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
