'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface Particle {
  progress: number;
  speed: number;
  offset: number;
}

interface ColorGradient {
  start: string;
  end: string;
}
interface FlowLine {
  id: number;
  progress: number;
  speed: number;
  color: ColorGradient;
  pathOffset: number;
  particles: Particle[];
}

const FlowAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const linesRef = useRef<FlowLine[]>([]);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  const colors: ColorGradient[] = [
    { start: '#60a5fa', end: '#a78bfa' },
    { start: '#c084fc', end: '#f9a8d4' },
    { start: '#22d3ee', end: '#818cf8' },
    { start: '#f472b6', end: '#c084fc' },
    { start: '#818cf8', end: '#60a5fa' },
  ];

  const createParticles = (count: number, baseProgress: number): Particle[] => {
    return Array.from({ length: count }, () => ({
      progress: Math.random(),
      speed: 0.002 + Math.random() * 0.003,
      offset: Math.random() * Math.PI * 2,
    }));
  };

  const initLines = useCallback(() => {
    const newLines: FlowLine[] = [];
    for (let i = 0; i < 12; i++) {
      newLines.push({
        id: i,
        progress: Math.random(),
        speed: 0.0005 + Math.random() * 0.001,
        color: colors[Math.floor(Math.random() * colors.length)],
        pathOffset: i * 0.3,
        particles: createParticles(5 + Math.floor(Math.random() * 5), Math.random()),
      });
    }
    linesRef.current = newLines;
  }, []);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePosRef.current = null;
  }, []);

  const getPathPoint = (progress: number, width: number, height: number) => {
    // Normalize progress from 0 to 1 across the screen width
    const x = progress * width;

    // Create a bezier curve that starts from left, curves to center, then goes right
    let y: number;

    if (progress < 0.3) {
      // Left side - multiple lines spread out
      const t = progress / 0.3;
      y = height * (0.2 + 0.6 * t);
    } else if (progress < 0.7) {
      // Center - curves merge
      const t = (progress - 0.3) / 0.4;
      y = height * (0.5 + 0.3 * Math.sin(t * Math.PI));
    } else {
      // Right side - single merged flow
      const t = (progress - 0.7) / 0.3;
      y = height * (0.5 + 0.1 * Math.sin(t * Math.PI * 2));
    }

    // Add subtle wave effect
    const waveY = Math.sin(progress * Math.PI * 4) * 20;

    return { x, y: y + waveY };
  };

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    line: FlowLine,
    width: number,
    height: number
  ) => {
    const points: { x: number; y: number }[] = [];
    const steps = 100;

    // Generate points along the path
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Adjust progress with offset for multiple lines
      const adjustedProgress = (t + line.progress * 0.3 + line.pathOffset * 0.1) % 1;
      points.push(getPathPoint(adjustedProgress, width, height));
    }

    // Draw the main line with gradient
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, line.color.start);
    gradient.addColorStop(1, line.color.end);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.shadowColor = line.color.end;
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Draw particles
    line.particles.forEach(particle => {
      const particleProgress = (particle.progress + line.progress * 0.5) % 1;
      const point = getPathPoint(particleProgress, width, height);

      // Particle glow
      ctx.shadowColor = line.color.end;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);

      // Particle gradient
      const particleGradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, 5
      );
      particleGradient.addColorStop(0, line.color.end);
      particleGradient.addColorStop(0.5, line.color.start);
      particleGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = particleGradient;
      ctx.fill();

      // Update particle progress
      particle.progress += particle.speed;
      if (particle.progress > 1) {
        particle.progress = 0;
      }
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with fade effect for trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // Update line progress
    linesRef.current.forEach(line => {
      line.progress += line.speed;
      if (line.progress > 1) {
        line.progress = 0;
        // Reset particles when line loops
        line.particles = createParticles(line.particles.length, 0);
      }
    });

    // Apply mouse influence
    if (mousePosRef.current) {
      const mouseX = mousePosRef.current.x / width;
      linesRef.current.forEach(line => {
        // Subtle speed change based on mouse position
        line.speed = 0.0005 + mouseX * 0.001;
      });
    }

    // Draw all lines
    linesRef.current.forEach(line => {
      drawLine(ctx, line, width, height);
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    initLines();
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initLines, handleResize, animate, handleMouseMove, handleMouseLeave]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        background: 'black',
      }}
    />
  );
};

export default FlowAnimation;