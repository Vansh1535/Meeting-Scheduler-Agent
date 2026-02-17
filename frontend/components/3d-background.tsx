"use client";

import { useRef, useEffect } from "react";

export function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Floating geometric shapes
    class FloatingShape {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      type: 'circle' | 'square' | 'triangle';
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.z = Math.random() * 500 + 100;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.vz = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 20 + 10;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.type = ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle';
        
        const colors = ['#7c5cff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.3 + 0.05;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.rotation += this.rotationSpeed;

        // Wrap around edges
        if (this.x > window.innerWidth + 50) this.x = -50;
        if (this.x < -50) this.x = window.innerWidth + 50;
        if (this.y > window.innerHeight + 50) this.y = -50;
        if (this.y < -50) this.y = window.innerHeight + 50;
        if (this.z > 600) this.z = 100;
        if (this.z < 100) this.z = 600;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const scale = 300 / this.z;
        const size = this.size * scale;
        
        if (size < 1) return;

        ctx.save();
        ctx.globalAlpha = this.alpha * scale;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        switch (this.type) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
            
          case 'square':
            ctx.fillRect(-size / 2, -size / 2, size, size);
            break;
            
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(0, -size / 2);
            ctx.lineTo(-size / 2, size / 2);
            ctx.lineTo(size / 2, size / 2);
            ctx.closePath();
            ctx.fill();
            break;
        }
        
        ctx.restore();
      }
    }

    // Gradient orbs
    class GradientOrb {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color1: string;
      color2: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 100 + 50;
        
        const colorPairs = [
          ['#667eea', '#764ba2'],
          ['#f093fb', '#f5576c'],
          ['#4facfe', '#00f2fe'],
          ['#43e97b', '#38f9d7'],
          ['#fa709a', '#fee140']
        ];
        
        const colors = colorPairs[Math.floor(Math.random() * colorPairs.length)];
        this.color1 = colors[0];
        this.color2 = colors[1];
        this.alpha = Math.random() * 0.1 + 0.02;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x > window.innerWidth + this.size) this.x = -this.size;
        if (this.x < -this.size) this.x = window.innerWidth + this.size;
        if (this.y > window.innerHeight + this.size) this.y = -this.size;
        if (this.y < -this.size) this.y = window.innerHeight + this.size;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, this.color1 + Math.floor(this.alpha * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, this.color2 + '00');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          this.x - this.size,
          this.y - this.size,
          this.size * 2,
          this.size * 2
        );
      }
    }

    // Network lines
    class NetworkLine {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      progress: number;
      speed: number;
      color: string;

      constructor() {
        this.startX = Math.random() * window.innerWidth;
        this.startY = Math.random() * window.innerHeight;
        this.endX = Math.random() * window.innerWidth;
        this.endY = Math.random() * window.innerHeight;
        this.progress = 0;
        this.speed = Math.random() * 0.01 + 0.005;
        this.color = '#7c5cff';
      }

      update() {
        this.progress += this.speed;
        if (this.progress > 1) {
          this.progress = 0;
          this.startX = Math.random() * window.innerWidth;
          this.startY = Math.random() * window.innerHeight;
          this.endX = Math.random() * window.innerWidth;
          this.endY = Math.random() * window.innerHeight;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        const currentX = this.startX + (this.endX - this.startX) * this.progress;
        const currentY = this.startY + (this.endY - this.startY) * this.progress;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.38 * (1 - this.progress);
        
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
      }
    }

    // Initialize elements
    const shapes: FloatingShape[] = [];
    const orbs: GradientOrb[] = [];
    const lines: NetworkLine[] = [];
    
    for (let i = 0; i < 30; i++) {
      shapes.push(new FloatingShape());
    }
    
    for (let i = 0; i < 8; i++) {
      orbs.push(new GradientOrb());
    }
    
    for (let i = 0; i < 15; i++) {
      lines.push(new NetworkLine());
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw gradient orbs (background)
      orbs.forEach(orb => {
        orb.update();
        orb.draw(ctx);
      });

      // Draw network lines
      lines.forEach(line => {
        line.update();
        line.draw(ctx);
      });

      // Draw floating shapes
      shapes.forEach(shape => {
        shape.update();
        shape.draw(ctx);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
