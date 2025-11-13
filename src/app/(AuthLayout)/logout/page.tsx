'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resetReduxStore } from '@/redux/store';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    Cookies.remove('access_token');
    Cookies.remove('tenant');

    resetReduxStore().then(() => {
      setTimeout(() => {
        router.replace('/login');
      }, 3000); 
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1e293b, #3b82f6)',
        }}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 5, opacity: 0 }}
        transition={{
          duration: 2.5,
          ease: 'easeOut',
          repeat: 1,
          repeatDelay: 0.5,
        }}
      />

      <motion.div
        className="text-center z-10"
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: 20 }}
        transition={{ duration: 1.5, delay: 1.5, ease: 'easeOut' }}
      >
        <h1
          className="text-3xl font-semibold tracking-tight text-white"
          style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
        >
          Goodbye for Now
        </h1>
        <motion.p
          className="mt-2 text-base text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeInOut' }}
        >
          Securely logging you out...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LogoutPage;