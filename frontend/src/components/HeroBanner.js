// frontend/src/components/HeroBanner.js
import React from 'react';
import { motion } from 'framer-motion';

const HeroBanner = () => {
  return (
    <div className="bg-slate-900 text-white py-16 px-8 text-center relative overflow-hidden">
      {/* Background shape/gradient for visual interest, inspired by industrial elements */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-yellow-400 to-slate-800 z-0"></div>
      <div className="absolute inset-0 opacity-5 from-yellow-400 to-slate-800 animate-pulse-slow"></div> {/* Subtle animation */}

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.h2 
          className="text-5xl md:text-6xl font-black mb-4 leading-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-yellow-400">Powering</span> Your Digital Factory
        </motion.h2>
        <motion.p 
          className="text-xl md:text-2xl text-slate-300 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Predictive Analytics, Optimized Operations.
        </motion.p>
        <motion.a 
          href="#fleet-overview" // Link to the fleet overview section
          className="inline-block bg-yellow-400 text-slate-900 font-bold uppercase px-8 py-3 text-lg transition-all duration-300 hover:bg-yellow-500 hover:shadow-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Explore Assets
        </motion.a>
      </div>
    </div>
  );
};

export default HeroBanner;