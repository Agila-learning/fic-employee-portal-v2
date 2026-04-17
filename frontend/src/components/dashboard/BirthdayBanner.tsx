import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake, PartyPopper, X, Sparkles } from 'lucide-react';
import { employeeService } from '@/api/employeeService';
import { Button } from '@/components/ui/button';

const BirthdayBanner = () => {
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const data = await employeeService.getTodayBirthdays();
        setBirthdays(data || []);
      } catch (error) {
        console.error('Failed to fetch birthdays', error);
      }
    };
    fetchBirthdays();
  }, []);

  if (!isVisible || birthdays.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative overflow-hidden mb-6"
      >
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-6 rounded-2xl shadow-xl shadow-purple-500/20 relative overflow-hidden group">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="h-24 w-24 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/30 animate-bounce">
                <Cake className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  Happy Birthday! <PartyPopper className="h-6 w-6 text-yellow-300" />
                </h2>
                <div className="mt-1 flex flex-wrap justify-center sm:justify-start gap-2">
                  {birthdays.map((person, idx) => (
                    <span key={idx} className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-white font-bold text-sm border border-white/20">
                      {person.name} {idx < birthdays.length - 1 ? '🎂' : '🎈'}
                    </span>
                  ))}
                </div>
                <p className="text-white/80 mt-2 text-sm font-medium italic">"Wishing you a day filled with happiness and a year filled with joy. Have a wonderful birthday! 🎉"</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsVisible(false)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BirthdayBanner;
