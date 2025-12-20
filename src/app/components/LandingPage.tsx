"use client";
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  Stack,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  TextField,
  Avatar,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TaskIcon from '@mui/icons-material/Task';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CloudIcon from '@mui/icons-material/Cloud';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import BusinessIcon from '@mui/icons-material/Business';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import createAxiosInstance from '@/app/axiosInstance';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Color scheme from image: Deep Cerulean Blue, Teal, White/Light Gray
const colors = {
  primaryBlue: '#1E3A8A',      // Deep cerulean blue
  secondaryBlue: '#3B82F6',   // Lighter blue
  teal: '#20B2AA',             // Teal
  lightTeal: '#5FD3CC',         // Light teal
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  darkGray: '#1F2937',
  textGray: '#6B7280',
};

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    company: '', 
    email: '', 
    phone: '', 
    message: '',
    services: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [caseStudyIndex, setCaseStudyIndex] = useState(0);
  const router = useRouter();
  const axiosInstance = createAxiosInstance();
  const testimonialCarouselRef = useRef<HTMLDivElement>(null);
  const caseStudyCarouselRef = useRef<HTMLDivElement>(null);

  // Refs for animations
  const heroRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations on page load
      if (heroContentRef.current) {
        const children = Array.from(heroContentRef.current.children);
        gsap.from(children, {
          y: 100,
          opacity: 0,
          duration: 1,
          stagger: 0.15,
          ease: 'power3.out',
        });
      }

      // Hero parallax background
      if (heroRef.current) {
        gsap.to(heroRef.current, {
          yPercent: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      // Hero visual parallax
      if (heroVisualRef.current) {
        gsap.to(heroVisualRef.current, {
          y: 40,
          rotation: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: heroVisualRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 10,
          },
        });
      }

      // Stats count-up animation
      if (statsRef.current) {
        const counters = statsRef.current.querySelectorAll('.stat-number');
        counters.forEach((counter: any) => {
          const target = parseInt(counter.getAttribute('data-target') || '0');
          const duration = 2;
          let current = 0;
          const increment = target / (duration * 60);

          ScrollTrigger.create({
            trigger: counter,
            start: 'top 80%',
            onEnter: () => {
              const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                  counter.textContent = target + (counter.getAttribute('data-suffix') || '');
                  clearInterval(timer);
                } else {
                  counter.textContent = Math.floor(current) + (counter.getAttribute('data-suffix') || '');
                }
              }, 1000 / 60);
            },
          });
        });
      }

      // Services cards animation
      if (servicesRef.current) {
        gsap.utils.toArray(servicesRef.current.children).forEach((card: any, i) => {
          gsap.from(card, {
            y: 80,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          });
        });
      }

      // Features section animation
      if (featuresRef.current) {
        const leftContent = featuresRef.current.querySelector('.features-left');
        const rightContent = featuresRef.current.querySelector('.features-right');
        
        if (leftContent) {
          gsap.from(leftContent, {
            x: -100,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top 75%',
            },
          });
        }

        if (rightContent) {
          gsap.from(rightContent, {
            x: 100,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top 75%',
            },
          });
        }
      }

      // Process timeline animation
      if (processRef.current) {
        gsap.utils.toArray(processRef.current.querySelectorAll('.process-step')).forEach((step: any, i) => {
          gsap.from(step, {
            scale: 0.8,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.2,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: step,
              start: 'top 80%',
            },
          });
        });
      }

      // Portfolio cards animation
      if (portfolioRef.current) {
        gsap.utils.toArray(portfolioRef.current.children).forEach((card: any) => {
          gsap.from(card, {
            y: 100,
            opacity: 0,
            scale: 0.9,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
            },
          });
        });
      }

      // Testimonials slider animation
      if (testimonialsRef.current) {
        gsap.from(testimonialsRef.current.children, {
          y: 60,
          opacity: 0,
          stagger: 0.15,
          duration: 0.8,
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: 'top 80%',
          },
        });
      }

      // CTA section animation
      if (ctaRef.current) {
        gsap.from(ctaRef.current.children, {
          y: 50,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 80%',
          },
        });
      }

      // Contact form animation
      if (contactRef.current) {
        gsap.from(contactRef.current.children, {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.6,
          scrollTrigger: {
            trigger: contactRef.current,
            start: 'top 80%',
          },
        });
      }

      // Floating elements
      gsap.to('.float-element', {
        y: -30,
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    return () => ctx.revert();
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceChange = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: Replace with actual API endpoint
      // const response = await axiosInstance.post('/contact/inquiry', formData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thank you! We\'ll get back to you soon.');
      setFormData({ name: '', company: '', email: '', phone: '', message: '', services: [] });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Operations Director',
      company: 'TechCorp Solutions',
      quote: 'Manazeit transformed how we manage projects. The dashboard gives us real-time visibility into everything, and task management is now seamless.',
      avatar: '/images/users/user-1.jpg',
    },
    {
      name: 'David Chen',
      role: 'HR Manager',
      company: 'Global Enterprises',
      quote: 'The attendance and leave management features saved us countless hours. The automated workflows are exactly what we needed.',
      avatar: '/images/users/user-2.jpg',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Project Manager',
      company: 'Innovate Labs',
      quote: 'Best work management platform we\'ve used. The collaboration features and reporting capabilities are outstanding.',
      avatar: '/images/users/user-3.jpg',
    },
    {
      name: 'Michael Thompson',
      role: 'CEO',
      company: 'StartupHub',
      quote: 'The multi-tenant architecture allows us to manage multiple clients seamlessly. Game-changer for our business.',
      avatar: '/images/users/user-1.jpg',
    },
    {
      name: 'Lisa Anderson',
      role: 'CTO',
      company: 'TechFlow Inc',
      quote: 'Implementation was smooth and the support team is exceptional. Our productivity increased significantly.',
      avatar: '/images/users/user-2.jpg',
    },
  ];

  const caseStudies = [
    {
      icon: <GroupWorkIcon />,
      title: 'Enterprise Team Collaboration',
      category: 'Project Management',
      description: 'Streamlined project workflows resulting in 45% faster delivery times',
    },
    {
      icon: <AccessTimeIcon />,
      title: 'Automated Attendance System',
      category: 'HR Management',
      description: 'Reduced HR administrative time by 70% with automated tracking',
    },
    {
      icon: <BusinessIcon />,
      title: 'Multi-Tenant Work Platform',
      category: 'SaaS Solution',
      description: 'Scalable platform supporting 500+ organizations simultaneously',
    },
    {
      icon: <AnalyticsIcon />,
      title: 'Real-time Analytics Dashboard',
      category: 'Business Intelligence',
      description: 'Data-driven decisions with comprehensive reporting and insights',
    },
  ];

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (testimonialCarouselRef.current) {
      const containerWidth = testimonialCarouselRef.current.offsetWidth;
      const cardWidth = containerWidth / 3;
      const gap = 24; // 3 * 8px = 24px
      const scrollAmount = cardWidth + gap;
      
      const currentIndex = testimonialIndex;
      const maxIndex = testimonials.length - 1;
      
      let newIndex;
      if (direction === 'left') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
      } else {
        newIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
      }
      
      setTestimonialIndex(newIndex);
      
      const scrollPosition = newIndex * scrollAmount;
      testimonialCarouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  };

  // Auto-scroll testimonials
  useEffect(() => {
    if (isMobile) return; // Don't auto-scroll on mobile
    
    const interval = setInterval(() => {
      if (testimonialCarouselRef.current) {
        const containerWidth = testimonialCarouselRef.current.offsetWidth;
        const cardWidth = containerWidth / 3;
        const gap = 24; // 3 * 8px = 24px
        const scrollAmount = cardWidth + gap;
        
        setTestimonialIndex((prevIndex) => {
          const maxIndex = testimonials.length - 1;
          const newIndex = prevIndex < maxIndex ? prevIndex + 1 : 0;
          
          const scrollPosition = newIndex * scrollAmount;
          testimonialCarouselRef.current?.scrollTo({
            left: scrollPosition,
            behavior: 'smooth',
          });
          
          return newIndex;
        });
      }
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(interval);
  }, [isMobile, testimonials.length]);

  const scrollCaseStudies = (direction: 'left' | 'right') => {
    if (caseStudyCarouselRef.current) {
      const cardWidth = caseStudyCarouselRef.current.offsetWidth / (isMobile ? 1 : 3);
      const scrollAmount = cardWidth + 32;
      const currentScroll = caseStudyCarouselRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      caseStudyCarouselRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      });
    }
  };

  const services = [
    {
      icon: <DashboardIcon sx={{ color: colors.teal }} />,
      title: 'Smart Dashboard',
      description: 'Real-time analytics and insights to track team performance, project progress, and productivity metrics at a glance.',
    },
    {
      icon: <TaskIcon sx={{ color: colors.teal }} />,
      title: 'Task Management',
      description: 'Kanban boards, task assignments, priority management, and progress tracking to keep projects on schedule.',
    },
    {
      icon: <AssessmentIcon sx={{ color: colors.teal }} />,
      title: 'Work Reports',
      description: 'Daily work reports, time tracking, comprehensive analytics, and automated reporting for better decision-making.',
    },
    {
      icon: <AccessTimeIcon sx={{ color: colors.teal }} />,
      title: 'Attendance Tracking',
      description: 'Automated attendance management with clock-in/out, timesheets, attendance reports, and leave balance tracking.',
    },
    {
      icon: <BeachAccessIcon sx={{ color: colors.teal }} />,
      title: 'Leave Management',
      description: 'Streamlined leave requests, approvals, calendar integration, and policy management for HR efficiency.',
    },
    {
      icon: <AccountTreeIcon sx={{ color: colors.teal }} />,
      title: 'Project Management',
      description: 'Complete project lifecycle management from planning to delivery with milestone tracking and resource allocation.',
    },
  ];

  const processSteps = [
    { number: '1', title: 'Sign Up', description: 'Create your account and set up your organization profile' },
    { number: '2', title: 'Configure', description: 'Customize settings, add team members, and set role-based permissions' },
    { number: '3', title: 'Integrate', description: 'Connect your tools and import existing data seamlessly' },
    { number: '4', title: 'Start Working', description: 'Begin managing projects, tasks, and tracking progress efficiently' },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', width: 280, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.teal }}>
          Manazeit
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        {['Features', 'Services', 'Process', 'Testimonials', 'Contact'].map((text) => (
          <ListItem key={text} disablePadding>
            <ListItemButton component="a" href={`#${text.toLowerCase()}`}>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={() => router.push('/login')}>
            <ListItemText primary="Login" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: colors.white, overflowX: 'hidden', position: 'relative', minHeight: '100vh' }}>
      {/* Animated Background Elements - Full Page Coverage */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Floating Gradient Orbs */}
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 300, md: 600 },
            height: { xs: 300, md: 600 },
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primaryBlue}80 0%, ${colors.primaryBlue}50 30%, ${colors.primaryBlue}20 60%, transparent 80%)`,
            top: { xs: '-5%', md: '-8%' },
            left: { xs: '-10%', md: '-5%' },
            animation: 'float1 15s ease-in-out infinite',
            filter: 'blur(60px)',
            opacity: 0.9,
            '@keyframes float1': {
              '0%, 100%': {
                transform: 'translate(0, 0) scale(1)',
              },
              '50%': {
                transform: 'translate(50px, 30px) scale(1.15)',
              },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 350, md: 700 },
            height: { xs: 350, md: 700 },
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.teal}75 0%, ${colors.teal}45 30%, ${colors.teal}20 60%, transparent 80%)`,
            bottom: { xs: '-5%', md: '-8%' },
            right: { xs: '-15%', md: '-5%' },
            animation: 'float2 20s ease-in-out infinite',
            filter: 'blur(70px)',
            opacity: 0.85,
            '@keyframes float2': {
              '0%, 100%': {
                transform: 'translate(0, 0) scale(1)',
              },
              '50%': {
                transform: 'translate(-50px, -30px) scale(1.2)',
              },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 280, md: 550 },
            height: { xs: 280, md: 550 },
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.secondaryBlue}70 0%, ${colors.secondaryBlue}40 30%, ${colors.secondaryBlue}15 60%, transparent 80%)`,
            top: { xs: '10%', md: '5%' },
            right: { xs: '-8%', md: '5%' },
            animation: 'float3 18s ease-in-out infinite',
            filter: 'blur(55px)',
            opacity: 0.8,
            '@keyframes float3': {
              '0%, 100%': {
                transform: 'translate(0, 0) scale(1)',
              },
              '50%': {
                transform: 'translate(-40px, 20px) scale(1.25)',
              },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 250, md: 500 },
            height: { xs: 250, md: 500 },
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.lightTeal}65 0%, ${colors.teal}40 30%, ${colors.teal}15 60%, transparent 80%)`,
            top: { xs: '15%', md: '8%' },
            left: { xs: '2%', md: '3%' },
            animation: 'float4 22s ease-in-out infinite',
            filter: 'blur(65px)',
            opacity: 0.75,
            '@keyframes float4': {
              '0%, 100%': {
                transform: 'translate(0, 0) scale(1)',
              },
              '50%': {
                transform: 'translate(40px, -20px) scale(1.3)',
              },
            },
          }}
        />

        {/* Floating Geometric Shapes */}
        <Box
          sx={{
            position: 'absolute',
            width: 80,
            height: 80,
            border: `3px solid ${colors.primaryBlue}60`,
            borderRadius: '16px',
            top: '15%',
            left: { xs: '3%', md: '8%' },
            animation: 'rotate1 25s linear infinite',
            boxShadow: `0 0 30px ${colors.primaryBlue}50`,
            opacity: 0.8,
            '@keyframes rotate1': {
              '0%': {
                transform: 'rotate(0deg) translateY(0)',
              },
              '50%': {
                transform: 'rotate(180deg) translateY(-40px)',
              },
              '100%': {
                transform: 'rotate(360deg) translateY(0)',
              },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 70,
            height: 70,
            border: `3px solid ${colors.teal}55`,
            borderRadius: '50%',
            bottom: '20%',
            right: { xs: '5%', md: '10%' },
            animation: 'pulse1 3s ease-in-out infinite',
            boxShadow: `0 0 35px ${colors.teal}50`,
            opacity: 0.75,
            '@keyframes pulse1': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 0.6,
              },
              '50%': {
                transform: 'scale(1.6)',
                opacity: 0.9,
              },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 0,
            height: 0,
            borderLeft: '20px solid transparent',
            borderRight: '20px solid transparent',
            borderBottom: `35px solid ${colors.secondaryBlue}50`,
            top: '55%',
            left: { xs: '2%', md: '6%' },
            animation: 'floatTriangle 12s ease-in-out infinite',
            filter: `drop-shadow(0 0 20px ${colors.secondaryBlue}60)`,
            opacity: 0.7,
            '@keyframes floatTriangle': {
              '0%, 100%': {
                transform: 'translateY(0) rotate(0deg)',
              },
              '50%': {
                transform: 'translateY(-50px) rotate(180deg)',
              },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 55,
            height: 55,
            background: `linear-gradient(135deg, ${colors.teal}50, ${colors.primaryBlue}50)`,
            borderRadius: '10px',
            top: '70%',
            right: { xs: '3%', md: '15%' },
            animation: 'rotate2 20s linear infinite',
            boxShadow: `0 0 25px ${colors.teal}60`,
            opacity: 0.8,
            '@keyframes rotate2': {
              '0%': {
                transform: 'rotate(0deg) scale(1)',
              },
              '50%': {
                transform: 'rotate(180deg) scale(1.3)',
              },
              '100%': {
                transform: 'rotate(360deg) scale(1)',
              },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 45,
            height: 45,
            border: `2px solid ${colors.lightTeal}60`,
            borderRadius: '50%',
            top: '35%',
            right: { xs: '2%', md: '20%' },
            animation: 'pulse2 4s ease-in-out infinite',
            boxShadow: `0 0 20px ${colors.lightTeal}50`,
            opacity: 0.7,
            '@keyframes pulse2': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 0.5,
              },
              '50%': {
                transform: 'scale(1.4)',
                opacity: 0.8,
              },
            },
          }}
        />
      </Box>

      {/* Navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          background: 'transparent',
          borderBottom: 'none',
          py: 0,
          boxShadow: 'none',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Toolbar disableGutters sx={{ py: 0.5, justifyContent: 'space-between', minHeight: '50px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Image
                src="/images/logos/time-sheet-base-logo.png"
                alt="Manazeit Logo"
                width={60}
                height={60}
                style={{ objectFit: 'contain' }}
              />
              {/* <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.teal} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: { xs: 'none', md: 'block' },
                }}
              >
                Manazeit
              </Typography> */}
            </Box>

            <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 4, alignItems: 'center' }}>
              {['Features', 'Services', 'Process', 'Testimonials', 'Contact'].map((text) => (
                <Button
                  key={text}
                  href={`#${text.toLowerCase()}`}
                  sx={{
                    color: colors.darkGray,
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    '&:hover': { color: colors.teal, bgcolor: 'transparent' },
                  }}
                >
                  {text}
                </Button>
              ))}
              <Button
                variant="contained"
                onClick={() => router.push('/register')}
                sx={{
                  bgcolor: colors.teal,
                  color: colors.white,
                  px: 3.5,
                  py: 1.25,
                  borderRadius: 3,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: `0 4px 16px ${colors.teal}40`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: colors.lightTeal,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${colors.teal}60`,
                  },
                }}
              >
                Get Started
              </Button>
            </Box>

            <IconButton onClick={handleDrawerToggle} sx={{ display: { lg: 'none' }, color: colors.darkGray }}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer open={mobileOpen} onClose={handleDrawerToggle} anchor="right">
        {drawer}
      </Drawer>

      {/* Hero Section */}
      <Box
        ref={heroRef}
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: { xs: '90vh', md: '85vh' },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${colors.lightGray} 0%, ${colors.white} 50%, ${colors.lightGray} 100%)`,
          py: { xs: 4, md: 6 },
        }}
      >
        {/* Animated background layers */}
        <Box
          className="float-element"
          sx={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.teal}15 0%, transparent 70%)`,
            top: '-10%',
            right: '-5%',
            zIndex: 0,
          }}
        />
        <Box
          className="float-element"
          sx={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primaryBlue}10 0%, transparent 70%)`,
            bottom: '-10%',
            left: '-5%',
            zIndex: 0,
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: { xs: 4, md: 6 },
              alignItems: 'center',
            }}
          >
            {/* Left Column - Text Content */}
            <Box
              ref={heroContentRef}
              sx={{
                flex: { xs: '1 1 100%', lg: '1 1 50%' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem', lg: '6rem' },
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: '-0.03em',
                  color: colors.primaryBlue,
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                Streamline Your
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.lightTeal} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    paddingBottom: `10px`,
                  }}
                >
                  Work Management
                </Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: colors.textGray,
                  mb: { xs: 3, md: 4 },
                  fontSize: { xs: '1rem', md: '1.2rem' },
                  lineHeight: 1.6,
                  fontWeight: 400,
                  maxWidth: '95%',
                }}
              >
                The all-in-one platform for project management, task tracking, attendance,
                leave management, and team collaboration. Built for modern teams.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/register')}
                  sx={{
                    bgcolor: colors.teal,
                    color: colors.white,
                    px: { xs: 4, md: 5 },
                    py: { xs: 1.5, md: 1.75 },
                    borderRadius: 3,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                    boxShadow: `0 8px 32px ${colors.teal}40`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: colors.lightTeal,
                      transform: 'translateY(-3px)',
                      boxShadow: `0 12px 40px ${colors.teal}50`,
                    },
                  }}
                >
                  Create Your Workspace
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  href="#features"
                  sx={{
                    borderColor: colors.primaryBlue,
                    borderWidth: 2,
                    color: colors.primaryBlue,
                    px: { xs: 4, md: 5 },
                    py: { xs: 1.5, md: 1.75 },
                    borderRadius: 3,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: colors.teal,
                      borderWidth: 2,
                      bgcolor: colors.teal,
                      color: colors.white,
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  Learn More
                </Button>
              </Stack>
            </Box>

            {/* Right Column - Dashboard Preview */}
            <Box
              sx={{
                flex: { xs: '1 1 100%', lg: '1 1 50%' },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mt: { xs: 4, lg: 0 },
              }}
            >
              <Box
                ref={heroVisualRef}
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: { xs: 450, md: 550, lg: 650 },
                  minHeight: { xs: 450, md: 550 },
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mt: { xs: 4, lg: 0 },
                  bgcolor: 'transparent',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.teal} 100%)`,
                    boxShadow: `0 32px 80px ${colors.primaryBlue}30`,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    p: { xs: 2.5, md: 3.5 },
                    border: `2px solid rgba(255,255,255,0.3)`,
                    minHeight: { xs: 450, md: 550 },
                  }}
                >
                  {/* Background Pattern */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 70%)',
                      zIndex: 0,
                    }}
                  />

                  {/* Dashboard Mockup Visual */}
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 2,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: { xs: 1.5, md: 2 },
                      minHeight: 0,
                    }}
                  >
                    {/* Top Bar */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: 'rgba(255,255,255,0.15)',
                        p: 1.5,
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.white }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.5)' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.5)' }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: colors.white, fontWeight: 600 }}>
                        Dashboard Preview
                      </Typography>
                      <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                    </Box>

                    {/* Main Content Grid */}
                    <Box
                      sx={{
                        flexGrow: 1,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                        gap: 2,
                      }}
                    >
                      {/* Left Column - Charts */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Chart Card */}
                        <Box
                          sx={{
                            flexGrow: 1,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            borderRadius: 2,
                            p: 2,
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: colors.white, fontWeight: 600 }}>
                            Project Progress
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 120 }}>
                            <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.4)', height: '60%', borderRadius: 1 }} />
                            <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.5)', height: '80%', borderRadius: 1 }} />
                            <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.6)', height: '100%', borderRadius: 1 }} />
                            <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.5)', height: '70%', borderRadius: 1 }} />
                            <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.4)', height: '50%', borderRadius: 1 }} />
                          </Box>
                        </Box>

                        {/* Stats Row */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box
                            sx={{
                              flex: 1,
                              bgcolor: 'rgba(255,255,255,0.15)',
                              borderRadius: 2,
                              p: 1.5,
                              backdropFilter: 'blur(10px)',
                              textAlign: 'center',
                            }}
                          >
                            <Typography variant="h6" sx={{ color: colors.white, fontWeight: 700 }}>
                              24
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              Tasks
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              flex: 1,
                              bgcolor: 'rgba(255,255,255,0.15)',
                              borderRadius: 2,
                              p: 1.5,
                              backdropFilter: 'blur(10px)',
                              textAlign: 'center',
                            }}
                          >
                            <Typography variant="h6" sx={{ color: colors.white, fontWeight: 700 }}>
                              8
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              Projects
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Right Column - Tasks List */}
                      <Box
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.15)',
                          borderRadius: 2,
                          p: 2,
                          backdropFilter: 'blur(10px)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: colors.white, fontWeight: 600, mb: 1 }}>
                          Recent Tasks
                        </Typography>
                        {[1, 2, 3, 4].map((item) => (
                          <Box
                            key={item}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              borderRadius: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.5)',
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Box
                                sx={{
                                  height: 8,
                                  bgcolor: 'rgba(255,255,255,0.4)',
                                  borderRadius: 1,
                                  mb: 0.5,
                                  width: `${60 + item * 10}%`,
                                }}
                              />
                              <Box
                                sx={{
                                  height: 6,
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                  borderRadius: 1,
                                  width: '40%',
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Trust / Stats Section */}
      <Box
        ref={statsRef}
        sx={{
          py: { xs: 6, md: 8 },
          bgcolor: colors.white,
          position: 'relative',
          zIndex: 1,
          borderTop: `1px solid ${colors.lightGray}`,
          borderBottom: `1px solid ${colors.lightGray}`,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Grid container spacing={4} justifyContent="center">
            {[
              { number: 500, suffix: '+', label: 'Active Organizations' },
              { number: 10000, suffix: '+', label: 'Daily Users' },
              { number: 50, suffix: '+', label: 'Projects Completed' },
              { number: 99, suffix: '%', label: 'Uptime Guarantee' },
            ].map((stat, index) => (
              // @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    className="stat-number"
                    data-target={stat.number}
                    data-suffix={stat.suffix}
                    variant="h2"
                    sx={{
                      fontSize: { xs: '2rem', md: '3rem' },
                      fontWeight: 800,
                      color: colors.teal,
                      mb: 1,
                    }}
                  >
                    {stat.number}{stat.suffix}
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.textGray, fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Services Section */}
      <Box
        id="services"
        ref={servicesRef}
        sx={{
          py: { xs: 6, md: 8 },
          bgcolor: colors.lightGray,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                fontWeight: 800,
                color: colors.primaryBlue,
                mb: 1.5,
              }}
            >
              Powerful Features for
              <Box component="span" sx={{ display: 'block', color: colors.teal }}>
                Modern Teams
              </Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.textGray,
                maxWidth: 700,
                mx: 'auto',
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              Everything you need to manage projects, track tasks, collaborate with your team,
              and streamline operations in one comprehensive platform.
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: { xs: 3, md: 4 },
            }}
          >
            {services.map((service, index) => (
              <Card
                key={index}
                sx={{
                  height: '100%',
                  minHeight: { xs: 200, md: 240 },
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 2.5,
                  bgcolor: colors.white,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                  border: `1px solid ${colors.lightGray}`,
                  display: 'flex',
                  flexDirection: 'row',
                  gap: { xs: 2, md: 2.5 },
                  alignItems: 'flex-start',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    bgcolor: colors.teal,
                    transform: 'scaleY(0)',
                    transformOrigin: 'top',
                    transition: 'transform 0.3s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${colors.teal}15, 0 2px 8px rgba(0,0,0,0.08)`,
                    borderColor: colors.teal,
                    '&::before': {
                      transform: 'scaleY(1)',
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: { xs: 48, md: 56 },
                    height: { xs: 48, md: 56 },
                    minWidth: { xs: 48, md: 56 },
                    borderRadius: 1.5,
                    bgcolor: `${colors.teal}08`,
                    flexShrink: 0,
                    '& svg': {
                      fontSize: { xs: 28, md: 32 },
                      color: colors.teal,
                    },
                  }}
                >
                  {service.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: colors.primaryBlue,
                      mb: 1,
                      fontSize: { xs: '1.1rem', md: '1.25rem' },
                      lineHeight: 1.3,
                    }}
                  >
                    {service.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.textGray,
                      lineHeight: 1.6,
                      fontSize: { xs: '0.875rem', md: '0.9rem' },
                    }}
                  >
                    {service.description}
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Why Choose Us / Features Section */}
      <Box
        id="features"
        ref={featuresRef}
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: colors.white,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Grid container spacing={6} alignItems="center">
            {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
            <Grid item xs={12} md={6} className="features-left">
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 800,
                  color: colors.primaryBlue,
                  mb: 3,
                }}
              >
                Why Choose
                <Box component="span" sx={{ display: 'block', color: colors.teal }}>
                  Manazeit?
                </Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: colors.textGray,
                  mb: 4,
                  lineHeight: 1.75,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  fontWeight: 400,
                }}
              >
                Experience the difference with our comprehensive work management solution
                designed to boost productivity and streamline operations.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                  },
                  gap: { xs: 2, md: 2.5 },
                }}
              >
                {[
                  'Increase productivity by up to 40%',
                  'Reduce administrative overhead by 60%',
                  'Real-time collaboration and communication',
                  'Comprehensive analytics and reporting',
                  'Mobile-responsive design',
                  'Enterprise-grade security',
                  'Customizable workflows',
                  '24/7 cloud-based access',
                ].map((benefit, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: `${colors.teal}05`,
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: { xs: 24, md: 28 },
                        height: { xs: 24, md: 28 },
                        minWidth: { xs: 24, md: 28 },
                        borderRadius: '50%',
                        bgcolor: `${colors.lightTeal}20`,
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircleIcon
                        sx={{
                          color: colors.teal,
                          fontSize: { xs: 16, md: 18 },
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.darkGray,
                        fontSize: { xs: '0.9rem', md: '0.95rem' },
                        lineHeight: 1.5,
                      }}
                    >
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
            <Grid item xs={12} md={6} className="features-right">
              <Box
                sx={{
                  p: { xs: 3, md: 5 },
                  borderRadius: 4,
                  background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.teal} 100%)`,
                  color: colors.white,
                  boxShadow: `0 24px 80px ${colors.primaryBlue}30`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    filter: 'blur(40px)',
                  },
                }}
              >
                <CloudIcon sx={{ fontSize: { xs: 50, md: 70 }, mb: 3, position: 'relative', zIndex: 1 }} />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '1.75rem', md: '2rem' },
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  Cloud-Based Solution
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 4,
                    opacity: 0.95,
                    lineHeight: 1.75,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  Access your work management platform from anywhere, anytime. Our secure
                  cloud infrastructure ensures 99.9% uptime and seamless performance.
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: { xs: 3, md: 5 },
                    mt: 4,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        mb: 0.5,
                      }}
                    >
                      99.9%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.95rem' }}>
                      Uptime
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        mb: 0.5,
                      }}
                    >
                      24/7
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.95rem' }}>
                      Support
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Process / How We Work Section */}
      <Box
        id="process"
        ref={processRef}
        sx={{
          py: { xs: 6, md: 8 },
          bgcolor: colors.lightGray,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                fontWeight: 800,
                color: colors.primaryBlue,
                mb: 1.5,
              }}
            >
              How It Works
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.textGray,
                maxWidth: 650,
                mx: 'auto',
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              Get started in minutes with our simple setup process
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: { xs: 3, md: 3 },
              position: 'relative',
            }}
          >
            {processSteps.map((step, index) => (
              <Box
                key={index}
                className="process-step"
                sx={{
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: 'auto', md: '80px' },
                    left: { xs: '50%', md: '100%' },
                    bottom: { xs: '-20px', md: 'auto' },
                    transform: { xs: 'translateX(-50%)', md: 'translateY(-50%)' },
                    width: { xs: '2px', md: '40px' },
                    height: { xs: '20px', md: '2px' },
                    bgcolor: colors.teal,
                    opacity: 0.3,
                    display: index === processSteps.length - 1 ? 'none' : { xs: 'block', md: 'block' },
                    zIndex: 0,
                  },
                }}
              >
                <Box
                  sx={{
                    textAlign: 'center',
                    p: { xs: 3, md: 3.5 },
                    borderRadius: 2.5,
                    bgcolor: colors.white,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '100%',
                    minHeight: { xs: 220, md: 260 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: `1px solid ${colors.lightGray}`,
                    position: 'relative',
                    zIndex: 1,
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 12px 32px ${colors.teal}18`,
                      borderColor: colors.teal,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 64, md: 80 },
                      height: { xs: 64, md: 80 },
                      borderRadius: '50%',
                      bgcolor: colors.teal,
                      color: colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2.5,
                      fontSize: { xs: '1.5rem', md: '2rem' },
                      fontWeight: 700,
                      boxShadow: `0 6px 20px ${colors.teal}25`,
                      transition: 'all 0.3s ease',
                      flexShrink: 0,
                    }}
                  >
                    {step.number}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: colors.primaryBlue,
                      mb: 1.5,
                      fontSize: { xs: '1.15rem', md: '1.3rem' },
                      flexShrink: 0,
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.textGray,
                      lineHeight: 1.6,
                      fontSize: { xs: '0.875rem', md: '0.9rem' },
                      textAlign: 'center',
                    }}
                  >
                    {step.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Portfolio / Case Studies Section */}
      <Box
        id="portfolio"
        ref={portfolioRef}
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: colors.white,
          position: 'relative',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 800,
                color: colors.primaryBlue,
                mb: 2,
              }}
            >
              Real Results from
              <Box component="span" sx={{ display: 'block', color: colors.teal }}>
                Real Teams
              </Box>
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: colors.textGray,
                maxWidth: 700,
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.125rem' },
                lineHeight: 1.7,
                fontWeight: 400,
              }}
            >
              See how organizations are transforming their work management with Manazeit
            </Typography>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => scrollCaseStudies('left')}
              sx={{
                position: 'absolute',
                left: { xs: -10, md: -20 },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                bgcolor: colors.white,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  bgcolor: colors.lightGray,
                },
                display: { xs: 'none', md: 'flex' },
              }}
            >
              <ArrowBackIosIcon sx={{ color: colors.primaryBlue }} />
            </IconButton>
            <Box
              ref={caseStudyCarouselRef}
              sx={{
                display: 'flex',
                gap: 4,
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                pb: 2,
              }}
            >
              {caseStudies.map((caseStudy, index) => (
                <Card
                  key={index}
                  sx={{
                    minWidth: { xs: '100%', md: 'calc(33.333% - 22px)' },
                    height: { xs: 300, md: 400 },
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    bgcolor: colors.darkGray,
                    flexShrink: 0,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 60px ${colors.primaryBlue}30`,
                      '& .case-overlay': {
                        bgcolor: 'rgba(0,0,0,0.8)',
                      },
                      '& .case-image': {
                        transform: 'scale(1.1)',
                      },
                    },
                  }}
                >
                  <Box
                    className="case-image"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.teal} 100%)`,
                      transition: 'transform 0.4s ease',
                    }}
                  />
                  <Box
                    className="case-overlay"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      p: 4,
                      transition: 'background-color 0.4s ease',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: { xs: 24, md: 32 },
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: { xs: 80, md: 100 },
                        height: { xs: 80, md: 100 },
                        borderRadius: 2.5,
                        // bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        '& svg': {
                          fontSize: { xs: 58, md: 70 },
                          color: colors.white,
                        },
                      }}
                    >
                      {caseStudy.icon}
                    </Box>
                    <Box>
                      <Chip
                        label={caseStudy.category}
                        size="small"
                        sx={{
                          bgcolor: colors.teal,
                          color: colors.white,
                          mb: 2,
                          fontWeight: 600,
                          alignSelf: 'flex-start',
                        }}
                      />
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: colors.white,
                          mb: 1.5,
                          fontSize: { xs: '1.25rem', md: '1.5rem' },
                        }}
                      >
                        {caseStudy.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.95)',
                          lineHeight: 1.6,
                        }}
                      >
                        {caseStudy.description}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
            <IconButton
              onClick={() => scrollCaseStudies('right')}
              sx={{
                position: 'absolute',
                right: { xs: -10, md: -20 },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                bgcolor: colors.white,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  bgcolor: colors.lightGray,
                },
                display: { xs: 'none', md: 'flex' },
              }}
            >
              <ArrowForwardIosIcon sx={{ color: colors.primaryBlue }} />
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box
        id="testimonials"
        ref={testimonialsRef}
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: colors.white,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Grid container spacing={6} alignItems="center">
            {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
            <Grid item xs={12} md={5}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 800,
                  color: colors.darkGray,
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                This makes our hearts beat faster every day
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: colors.textGray,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  lineHeight: 1.6,
                  mb: 4,
                }}
              >
                There are many reasons why our partners love to work with us
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <IconButton
                  onClick={() => scrollTestimonials('left')}
                  sx={{
                    bgcolor: colors.lightGray,
                    color: colors.darkGray,
                    '&:hover': {
                      bgcolor: colors.textGray,
                      color: colors.white,
                    },
                  }}
                >
                  <ArrowBackIosIcon />
                </IconButton>
                <IconButton
                  onClick={() => scrollTestimonials('right')}
                  sx={{
                    bgcolor: colors.lightGray,
                    color: colors.darkGray,
                    '&:hover': {
                      bgcolor: colors.textGray,
                      color: colors.white,
                    },
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </Box>
            </Grid>
            {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
            <Grid item xs={12} md={7}>
              <Box sx={{ position: 'relative' }}>
                <Box
                  ref={testimonialCarouselRef}
                  sx={{
                    display: 'flex',
                    gap: 3,
                    overflowX: 'auto',
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollSnapType: 'x mandatory',
                    '&::-webkit-scrollbar': {
                      display: 'none',
                    },
                    pb: 4,
                  }}
                >
                  {testimonials.map((testimonial, index) => {
                    const isActive = index === testimonialIndex;
                    return (
                      <Card
                        key={index}
                        sx={{
                          minWidth: { xs: '100%', md: 'calc(33.333% - 16px)' },
                          width: { xs: '100%', md: 'calc(33.333% - 16px)' },
                          minHeight: { xs: 400, md: 450 },
                          p: { xs: 3, md: 4 },
                          borderRadius: 3,
                          bgcolor: isActive ? '#8B5CF6' : colors.primaryBlue, // Purple for active, dark blue for others
                          flexShrink: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          scrollSnapAlign: 'center',
                        }}
                      >
                        <FormatQuoteIcon
                          sx={{
                            fontSize: { xs: 60, md: 80 },
                            color: 'rgba(255,255,255,0.3)',
                            position: 'absolute',
                            top: 20,
                            left: 20,
                          }}
                        />
                        <Typography
                          variant="body1"
                          sx={{
                            color: colors.white,
                            lineHeight: 1.8,
                            fontSize: { xs: '1rem', md: '1.1rem' },
                            mb: 'auto',
                            mt: 2,
                            zIndex: 1,
                          }}
                        >
                          {testimonial.quote}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4, zIndex: 1 }}>
                          <Avatar
                            src={testimonial.avatar}
                            sx={{ 
                              width: 56, 
                              height: 56,
                              border: `2px solid ${colors.white}`,
                            }}
                          />
                          <Box>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700, 
                                color: colors.white, 
                                fontSize: '1rem',
                              }}
                            >
                              {testimonial.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'rgba(255,255,255,0.9)', 
                                fontSize: '0.875rem',
                              }}
                            >
                              {testimonial.role} at {testimonial.company}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
                  {testimonials.map((_, index) => (
                    <FavoriteIcon
                      key={index}
                      onClick={() => {
                        setTestimonialIndex(index);
                        if (testimonialCarouselRef.current) {
                          const containerWidth = testimonialCarouselRef.current.offsetWidth;
                          const cardWidth = containerWidth / 3;
                          const gap = 24;
                          const scrollPosition = index * (cardWidth + gap);
                          testimonialCarouselRef.current.scrollTo({
                            left: scrollPosition,
                            behavior: 'smooth',
                          });
                        }
                      }}
                      sx={{
                        fontSize: 20,
                        color: index === testimonialIndex ? '#EC4899' : colors.textGray,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          color: '#EC4899',
                          transform: 'scale(1.2)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        ref={ctaRef}
        sx={{
          py: { xs: 10, md: 14 },
          bgcolor: colors.primaryBlue,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.teal} 100%)`,
            opacity: 0.95,
          }}
        />
        <Box
          className="float-element"
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            top: '-20%',
            right: '-10%',
            filter: 'blur(60px)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', color: colors.white }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 800,
                mb: 3,
                lineHeight: 1.2,
              }}
            >
              Ready to Transform Your
              <Box component="span" sx={{ display: 'block' }}>
                Work Management?
              </Box>
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 5,
                opacity: 0.95,
                maxWidth: 700,
                mx: 'auto',
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                lineHeight: 1.7,
                fontWeight: 400,
              }}
            >
              Join thousands of teams already using Manazeit to streamline their operations
              and boost productivity.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push('/register')}
                sx={{
                  bgcolor: colors.white,
                  color: colors.primaryBlue,
                  px: { xs: 5, md: 6 },
                  py: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: colors.lightGray,
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                  },
                }}
              >
                Create Your Workspace
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="#contact"
                sx={{
                  borderColor: colors.white,
                  borderWidth: 2,
                  color: colors.white,
                  px: { xs: 5, md: 6 },
                  py: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: colors.white,
                    borderWidth: 2,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                Contact Sales
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Contact / Inquiry Form Section */}
      <Box
  id="contact"
  ref={contactRef}
  sx={{
    py: { xs: 10, md: 14 },
    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)',
    position: 'relative',
    zIndex: 1,
  }}
>
  <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
    <Grid container spacing={6} alignItems="center">
      {/* LEFT CONTENT */}
      {/* @ts-expect-error MUI Grid v7 */}
      <Grid item xs={12} md={6}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.6rem', md: '3.6rem' },
            fontWeight: 700,
            color: colors.primaryBlue,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            mb: 3,
          }}
        >
          Let’s scale your brand,
          <br /> together.
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: '1rem', md: '1.125rem' },
            color: colors.textGray,
            maxWidth: 460,
            mb: 4,
          }}
        >
          Tell us about your product, your goals, and your challenges.
          Our team will help you move faster with confidence.
        </Typography>

        <Typography
          sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: colors.darkGray,
            mb: 1,
          }}
        >
          Get started at
        </Typography>

        <Typography
          component="a"
          href="mailto:info@manazeit.com"
          sx={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: colors.primaryBlue,
            textDecoration: 'none',
            borderBottom: `2px solid ${colors.primaryBlue}`,
            pb: 0.5,
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          start@manazeit.com
        </Typography>

        <Box
          sx={{
            mt: 6,
            display: { xs: 'none', md: 'flex' },
          }}
        >
          <Box
            sx={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E40AF, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              color: '#fff',
              boxShadow: '0 30px 60px rgba(37,99,235,0.35)',
            }}
          >
            🤝
          </Box>
        </Box>
      </Grid>

      {/* FORM */}
      {/* @ts-expect-error MUI Grid v7 */}
      <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '50%' } }}>
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            border: '1px solid #EEF2FF',
            boxShadow: '0 40px 90px rgba(0,0,0,0.08)',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <form onSubmit={handleFormSubmit}>
            <Stack spacing={5}>
              {[
                { label: 'Name*', name: 'name', placeholder: 'Your name' },
                { label: 'Company*', name: 'company', placeholder: 'Company name' },
                { label: 'Phone', name: 'phone', placeholder: 'Phone number' },
                { label: 'Email Address*', name: 'email', placeholder: 'Email address', type: 'email' },
              ].map((field) => (
                <Box key={field.name}>
                  <Typography
                    sx={{
                      mb: 1.5,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: colors.darkGray,
                    }}
                  >
                    {field.label}
                  </Typography>
                  <TextField
                    fullWidth
                    required={field.label.includes('*')}
                    name={field.name}
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={(formData as any)[field.name]}
                    onChange={handleFormChange}
                    variant="standard"
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        py: 1,
                      },
                      '& .MuiInput-underline:before': {
                        borderBottom: '1px solid #CBD5E1',
                      },
                      '& .MuiInput-underline:hover:before': {
                        borderBottom: `1px solid ${colors.primaryBlue}`,
                      },
                      '& .MuiInput-underline:after': {
                        borderBottom: `2px solid ${colors.primaryBlue}`,
                        boxShadow: `0 4px 12px rgba(30,64,175,0.15)`,
                      },
                    }}
                  />
                </Box>
              ))}

              {/* MESSAGE */}
              <Box>
                <Typography
                  sx={{
                    mb: 1.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.darkGray,
                  }}
                >
                  How can we help?*
                </Typography>
                <TextField
                  name="message"
                  required
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Tell us briefly about your project"
                  value={formData.message}
                  onChange={handleFormChange}
                  variant="standard"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: '1rem',
                      py: 1,
                    },
                    '& .MuiInput-underline:before': {
                      borderBottom: '1px solid #CBD5E1',
                    },
                    '& .MuiInput-underline:after': {
                      borderBottom: `2px solid ${colors.primaryBlue}`,
                    },
                  }}
                />
              </Box>

              {/* SERVICES */}
              {/* <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: '#F8FAFF',
                  border: '1px solid #E0E7FF',
                }}
              >
                <Typography
                  sx={{
                    mb: 2,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.darkGray,
                  }}
                >
                  Services*
                </Typography>
                <FormGroup>
                  {['Task Management', 'Attendance Tracking'].map((service) => (
                    <FormControlLabel
                      key={service}
                      control={
                        <Checkbox
                          checked={formData.services.includes(service)}
                          onChange={() => handleServiceChange(service)}
                          sx={{
                            color: colors.primaryBlue,
                            '&.Mui-checked': {
                              color: colors.primaryBlue,
                            },
                          }}
                        />
                      }
                      label={service}
                      sx={{
                        mb: 1,
                        '&:hover': {
                          bgcolor: '#EEF2FF',
                          borderRadius: 1,
                        },
                      }}
                    />
                  ))}
                </FormGroup>
              </Box> */}

              {/* SUBMIT */}
              <Button
                type="submit"
                size="large"
                disabled={isSubmitting}
                sx={{
                  mt: 2,
                  py: 1.75,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  color: '#fff',
                  background: 'linear-gradient(135deg, #1E40AF, #2563EB)',
                  boxShadow: '0 16px 40px rgba(37,99,235,0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 22px 50px rgba(37,99,235,0.5)',
                  },
                  '&:disabled': {
                    opacity: 0.6,
                  },
                }}
              >
                {isSubmitting ? 'Sending…' : 'Send Message'}
              </Button>
            </Stack>
          </form>
        </Box>
      </Grid>
    </Grid>
  </Container>
</Box>


      {/* Footer */}
      <Box sx={{ 
        bgcolor: 'rgba(31, 41, 55, 0.85)', 
        backdropFilter: 'blur(20px)',
        color: colors.white, 
        py: { xs: 5, md: 6 },
        position: 'relative',
        zIndex: 1,
      }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Grid container spacing={4}>
            {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Image
                  src="/images/logos/time-sheet-base-logo.png"
                  alt="Manazeit Logo"
                  width={60}
                  height={60}
                  style={{ objectFit: 'contain' }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, mb: 3 }}>
                The comprehensive work management platform designed to streamline operations,
                boost productivity, and drive business growth.
              </Typography>
            </Grid>
            {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Quick Links
              </Typography>
              <Stack spacing={1.5}>
                {['Features', 'Services', 'Process', 'Testimonials', 'Contact'].map((link) => (
                  <Button
                    key={link}
                    href={`#${link.toLowerCase()}`}
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      '&:hover': {
                        color: colors.teal,
                        bgcolor: 'transparent',
                      },
                    }}
                  >
                    {link}
                  </Button>
                ))}
              </Stack>
            </Grid>
            {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Contact Info
              </Typography>
              <Stack spacing={1.5}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Email: info@manazeit.com
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Support: Available 24/7
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/register')}
                  sx={{
                    borderColor: colors.teal,
                    color: colors.teal,
                    alignSelf: 'flex-start',
                    mt: 1,
                    '&:hover': {
                      borderColor: colors.lightTeal,
                      bgcolor: colors.teal,
                      color: colors.white,
                    },
                  }}
                >
                  Get Started
                </Button>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              © {new Date().getFullYear()} Manazeit. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
