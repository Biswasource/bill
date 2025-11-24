import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Download, FileText } from "lucide-react";
import { Link } from "react-router";

const QuotationGeneratorLanding = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Create particles
    const createParticles = () => {
      particlesRef.current = [];
      const particleCount = 80;

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          color: Math.random() > 0.5 ? "#4285f4" : "#93b4e8",
        });
      }
    };

    createParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
      });

      // Draw connections
      ctx.globalAlpha = 0.15;
      particlesRef.current.forEach((p1, i) => {
        particlesRef.current.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = "#4285f4";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, []);

  return (
    <div
      className="relative min-h-screen bg-white overflow-hidden"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Animated Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="text-white" size={18} />
          </div>
          <span
            className="text-xl font-medium text-gray-900"
            style={{ fontWeight: 500 }}
          >
            Quotation Generator
          </span>
        </div>

        <nav
          className="hidden md:flex items-center gap-8 text-sm"
          style={{ fontWeight: 400 }}
        ></nav>

        <button
          className="bg-gray-900 text-white px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-gray-800 transition shadow-lg text-sm"
          style={{ fontWeight: 500 }}
        >
          <Download size={18} />
          Download
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center mt-[-7vh]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="text-white" size={24} />
          </div>
          <span
            className="text-3xl font-medium text-gray-900"
            style={{ fontWeight: 500 }}
          >
            Quotation Generator
          </span>
        </div>

        <h1
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-2 leading-tight"
          style={{ fontWeight: 600 }}
        >
          Experience liftoff
        </h1>

        <h2
          className="text-3xl md:text-4xl font-normal text-gray-700 mb-12 max-w-5xl"
          style={{ fontWeight: 500 }}
        >
          with the next-generation quotation tool
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/signup">
            <button
              className="bg-black text-white px-8 py-3 rounded-full flex items-center gap-3 hover:bg-gray-800 transition shadow-xl text-lg font-medium"
              style={{ fontWeight: 500 }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="opacity-90"
              >
                <path d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                <rect x="7" y="7" width="10" height="10" fill="white" />
              </svg>
              Get Started Free
            </button>
          </Link>

          <button
            className="text-gray-900 bg-gray-300 px-8 py-3 rounded-full hover:bg-gray-300 transition text-lg font-medium"
            style={{ fontWeight: 500 }}
          >
            Explore use cases
          </button>
        </div>

        {/* Decorative floating elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
        <div
          className="absolute top-1/3 right-1/4 w-3 h-3 bg-blue-500 rounded-full animate-pulse opacity-40"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-300 rounded-full animate-pulse opacity-50"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse opacity-45"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/5 w-2 h-2 bg-blue-500 rounded-full animate-pulse opacity-35"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute top-2/3 right-1/5 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-55"
          style={{ animationDelay: "1.8s" }}
        ></div>
      </main>
    </div>
  );
};

export default QuotationGeneratorLanding;
