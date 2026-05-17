import { useEffect, useRef } from 'react';

interface LetterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  size: number;
  color: string;
  alpha: number;
  targetAlpha: number;
  angle: number;
  rotationSpeed: number;
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: LetterParticle[] = [];
    const mouse = { x: -1000, y: -1000, active: false };

    const chars = 'SAMBUNGKATA'.split('');
    const colors = [
      'rgba(0, 74, 198, 0.08)',   // Primary brand blue (soft)
      'rgba(254, 166, 25, 0.08)',  // Secondary container amber (soft)
      'rgba(0, 98, 66, 0.08)',     // Tertiary green (soft)
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = Math.min(45, Math.floor((canvas.width * canvas.height) / 25000));
      for (let i = 0; i < count; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const size = Math.random() * 26 + 18; // 18px to 44px
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          char,
          size,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0,
          targetAlpha: Math.random() * 0.4 + 0.3,
          angle: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.01,
        });
      }
    };

    const drawGridLines = () => {
      // Draw premium engineering grid lines
      ctx.strokeStyle = 'rgba(0, 74, 198, 0.012)';
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle shifting dynamic radial mesh gradient
      const time = Date.now() * 0.0003;
      const gradX1 = canvas.width / 2 + Math.cos(time) * (canvas.width / 4);
      const gradY1 = canvas.height / 2 + Math.sin(time) * (canvas.height / 4);
      const gradX2 = canvas.width / 2 - Math.cos(time * 0.7) * (canvas.width / 4);
      const gradY2 = canvas.height / 2 - Math.sin(time * 0.7) * (canvas.height / 4);

      const radialGrad = ctx.createRadialGradient(gradX1, gradY1, 20, gradX2, gradY2, Math.max(canvas.width, canvas.height) * 0.75);
      radialGrad.addColorStop(0, 'rgba(235, 242, 255, 0.25)'); // Soft Primary Light tint
      radialGrad.addColorStop(0.5, 'rgba(255, 251, 245, 0.2)'); // Soft Amber Light tint
      radialGrad.addColorStop(1, 'rgba(248, 249, 255, 0.15)'); // Base background match
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGridLines();

      particles.forEach((p) => {
        // Fade in alpha gently
        if (p.alpha < p.targetAlpha) p.alpha += 0.008;

        // Apply friction-less physical floating motion
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.rotationSpeed;

        // Interactive mouse / touch repulsion force
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const forceRadius = 160;

          if (dist < forceRadius) {
            const force = (forceRadius - dist) / forceRadius; // 0 to 1
            const angle = Math.atan2(dy, dx);
            
            // Push particles away fluidly
            const pushX = Math.cos(angle) * force * 1.5;
            const pushY = Math.sin(angle) * force * 1.5;
            
            p.x += pushX;
            p.y += pushY;

            // Highlight alpha when reactive to hover
            p.alpha = Math.min(0.9, p.targetAlpha + force * 0.5);
          } else {
            // Smoothly restore default alpha
            p.alpha = p.alpha * 0.96 + p.targetAlpha * 0.04;
          }
        }

        // Seamless infinite border wrapping
        const margin = 40;
        if (p.x < -margin) p.x = canvas.width + margin;
        if (p.x > canvas.width + margin) p.x = -margin;
        if (p.y < -margin) p.y = canvas.height + margin;
        if (p.y > canvas.height + margin) p.y = -margin;

        // Draw character particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.font = `bold ${p.size}px "Montserrat", sans-serif`;
        
        // Soft drop-shadow
        ctx.shadowColor = 'rgba(0, 74, 198, 0.05)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillStyle = p.color.replace('0.08', p.alpha.toFixed(3));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(updateAndDraw);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseLeave);

    animationFrameId = requestAnimationFrame(updateAndDraw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-background transition-colors duration-300"
    />
  );
}
