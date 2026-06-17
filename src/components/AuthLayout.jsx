import React from "react";

export default function AuthLayout({ 
  icon: Icon, 
  title, 
  subtitle, 
  footer, 
  children, 
  isLogin = true 
}) {
  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* Left Side - Super Animated Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 items-center justify-center relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"
          style={{
            backgroundSize: "400% 400%",
            animation: "bg-shift 15s ease infinite"
          }}
        />
        
        {/* Tons of Floating Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {/* Big Floating Circles */}
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-white/10 rounded-full animate-float-slow" />
          <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] bg-white/8 rounded-full animate-float-slower" />
          <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] bg-white/12 rounded-full animate-float-slow" style={{ animationDelay: "2s" }} />
          
          {/* Medium Circles */}
          <div className="absolute top-1/4 left-1/6 w-32 h-32 bg-white/15 rounded-full animate-float" />
          <div className="absolute top-2/3 right-1/5 w-28 h-28 bg-white/10 rounded-full animate-float-reverse" />
          <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-white/20 rounded-full animate-float" style={{ animationDelay: "1.5s" }} />
          
          {/* Small Dots */}
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-4 h-4 bg-white/30 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
          
          {/* Animated SVG Shapes */}
          <svg className="absolute top-1/5 left-1/5 w-40 h-40 animate-spin-slow opacity-30" viewBox="0 0 100 100">
            <polygon points="50,10 90,90 10,90" fill="white" />
          </svg>
          <svg className="absolute bottom-1/4 right-1/4 w-36 h-36 animate-spin-slower opacity-20" viewBox="0 0 100 100" style={{ animationDirection: "reverse" }}>
            <rect x="20" y="20" width="60" height="60" fill="white" />
          </svg>
          <svg className="absolute top-1/2 left-3/4 w-28 h-28 animate-bounce opacity-25" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="white" />
          </svg>
        </div>
        
        {/* Main Content with Animations */}
        <div className="relative z-10 text-center px-12">
          <div 
            className="w-36 h-36 mx-auto mb-8 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-2xl animate-bounce-gentle"
            style={{ animationDuration: "3s" }}
          >
            <Icon className="w-18 h-18 text-white" />
          </div>
          <h2 className="text-5xl font-extrabold text-white mb-4 animate-fade-in-up">
            {isLogin ? "Welcome Back!" : "Join Us Today!"}
          </h2>
          <p className="text-white/80 text-xl max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {isLogin 
              ? "Continue your learning journey and pick up where you left off." 
              : "Start your learning adventure and unlock your full potential."}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 animate-fade-in-right">
            <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-2 text-lg">{subtitle}</p>}
          </div>
          
          <div className="animate-fade-in-right" style={{ animationDelay: "0.1s" }}>
            {children}
          </div>
          
          {footer && (
            <div className="mt-10 text-center animate-fade-in-right" style={{ animationDelay: "0.2s" }}>
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes bg-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-40px) rotate(10deg) scale(1.05); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-50px) rotate(5deg) scale(1.1); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-60px) rotate(-5deg) scale(1.08); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(40px) rotate(-10deg) scale(1.05); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-slower {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slower 14s ease-in-out infinite;
        }
        
        .animate-float-reverse {
          animation: float-reverse 7s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-slower {
          animation: spin-slower 30s linear infinite;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-fade-in-right {
          animation: fade-in-right 0.7s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
