import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, quotes } from '../data/quotes';
import { Quote as QuoteIcon, Sparkles } from 'lucide-react';

export default function QuoteWidget() {
  const [shuffledQuotes, setShuffledQuotes] = useState<Quote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const shuffle = useCallback((array: Quote[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  useEffect(() => {
    setShuffledQuotes(shuffle(quotes));
  }, [shuffle]);

  useEffect(() => {
    if (shuffledQuotes.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex + 1 >= shuffledQuotes.length) {
          // Reshuffle when done
          setShuffledQuotes(shuffle(quotes));
          return 0;
        }
        return prevIndex + 1;
      });
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [shuffledQuotes, shuffle]);

  const currentQuote = shuffledQuotes[currentIndex];

  if (!currentQuote) return null;

  return (
    <div className="brutal-card bg-[var(--color-yellow-pop)] p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-20 transition-opacity">
        <QuoteIcon size={48} className="text-black" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white border-[3px] border-black shadow-[2px_2px_0_#000]">
            <Sparkles size={14} className="text-black stroke-[3px]" />
          </div>
          <span className="text-[10px] font-black text-black uppercase tracking-widest bg-white border border-black px-2 py-0.5 shadow-[2px_2px_0px_#000]">
            {currentQuote.topic}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuote.text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-black font-bold text-lg leading-relaxed mb-4">
              "{currentQuote.text}"
            </p>
            <div className="flex items-center gap-2">
              <div className="h-[3px] w-4 bg-black" />
              <p className="text-black font-bold uppercase text-sm">
                {currentQuote.author}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar for 2 minutes */}
      <div className="absolute bottom-0 left-0 h-[3px] bg-black/20 w-full border-t border-black">
        <motion.div
          key={currentQuote.text}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 120, ease: "linear" }}
          className="h-full bg-black"
        />
      </div>
    </div>
  );
}
