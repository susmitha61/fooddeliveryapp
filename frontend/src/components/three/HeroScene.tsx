'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate floating 3D particle nodes
    const particleCount = 70;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 2 + 0.5,
      radius: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    // Floating Luminous 3D Orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.3, radius: 140, color: 'rgba(255, 122, 0, 0.25)', vx: 0.3, vy: 0.2 },
      { x: width * 0.8, y: height * 0.4, radius: 180, color: 'rgba(245, 158, 11, 0.2)', vx: -0.2, vy: 0.3 },
      { x: width * 0.5, y: height * 0.7, radius: 220, color: 'rgba(234, 88, 12, 0.15)', vx: 0.1, vy: -0.2 },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Luminous Orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < -100 || orb.x > width + 100) orb.vx *= -1;
        if (orb.y < -100 || orb.y > height + 100) orb.vy *= -1;

        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.radius
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Starfield Particles
      particles.forEach((p) => {
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 180, 100, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF7A00';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Decorative Floating 3D Elements */}
      <motion.div
        animate={{
          y: [-10, 10, -10],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-10 w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/10 backdrop-blur-xl border border-white/10 shadow-2xl hidden lg:block"
      />

      <motion.div
        animate={{
          y: [12, -12, 12],
          rotate: [0, -8, 8, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/3 right-12 w-32 h-32 rounded-full bg-gradient-to-br from-orange-500/20 to-rose-500/10 backdrop-blur-xl border border-white/10 shadow-2xl hidden lg:block"
      />
    </div>
  );
}
