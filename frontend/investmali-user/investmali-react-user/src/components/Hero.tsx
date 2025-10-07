import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Homepage3D from './Homepage3D';

// Import local images
import image1 from '../assets/images/9152579890_ef26494a82_b.jpg';
import image2 from '../assets/images/pngtree-bank-of-africa-in-bamako-river-construction-boa-photo-image_2872523.jpg';
import image3 from '../assets/images/istockphoto-132031519-612x612.jpg';
import image4 from '../assets/images/pngtree-bozo-fisherman-in-bamako-mali-culture-tradition-one-photo-image_2812581.jpg';

gsap.registerPlugin(ScrollTrigger);

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scene3DRef = useRef<HTMLDivElement>(null);
  const backgroundShapesRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Disintegration effect parameters (based on your example)
  const disintegrationConfig = {
    grid: 6,              // pixel sampling size (smaller = more particles)
    duration: 1100,       // disintegration duration (ms)
    spread: 260,          // explosion amplitude (px)
    gravity: 0.35,        // gravity (px/frame^2)
    fadeRatio: 0.9,       // particle opacity fade speed
    directionBias: -0.4,  // -1 left ← 0 neutral 1 right →
    holdNextAt: 0.55      // when to start showing next image (0..1)
  };

  const slides = [
    {
      id: 1,
      title: "Votre entreprise en 24 heures",
      subtitle: "Simplifiez vos démarches administratives avec notre plateforme digitale. Processus 100% en ligne, accompagnement personnalisé et délais réduits de 70%.",
      badge: "Plateforme #1 au Mali",
      cta: "Créer mon entreprise",
      backgroundImage: image1
    },
    {
      id: 2,
      title: "Accompagnement expert",
      subtitle: "Nos conseillers spécialisés vous guident à chaque étape. Support personnalisé, conseils juridiques et suivi en temps réel de votre dossier.",
      badge: "Support 24/7",
      cta: "Être accompagné",
      backgroundImage: image2
    },
    {
      id: 3,
      title: "Conformité garantie",
      subtitle: "Tous vos documents sont vérifiés par nos experts juridiques. Respect total de la réglementation malienne et validation officielle.",
      badge: "100% Conforme",
      cta: "En savoir plus",
      backgroundImage: image3
    },
    {
      id: 4,
      title: "Tradition et modernité",
      subtitle: "Respectez les valeurs maliennes tout en bénéficiant des dernières innovations technologiques. Un pont entre tradition et modernité pour votre entreprise.",
      badge: "Héritage Malien",
      cta: "Découvrir",
      backgroundImage: image4
    }
  ];

  // Fallback function for any remaining references
  const changeSlideWithFade = (newSlideIndex: number) => {
    disintegrateToSlide(newSlideIndex);
  };

  // Split bidirectional transition - left half goes up, right half goes down
  const disintegrateToSlide = (nextIndex: number) => {
    if (nextIndex === currentSlide || isTransitioning || !canvasRef.current) return;
    
    setIsTransitioning(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W;
    canvas.height = H;

    // Load current and next images
    const currentImg = new Image();
    const nextImg = new Image();
    currentImg.crossOrigin = 'anonymous';
    nextImg.crossOrigin = 'anonymous';

    let imagesLoaded = 0;
    const onImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        // For now, use split transition for all slides until other effects are implemented
        startSplitTransition();
      }
    };

    currentImg.onload = onImageLoad;
    nextImg.onload = onImageLoad;
    currentImg.src = slides[currentSlide].backgroundImage;
    nextImg.src = slides[nextIndex].backgroundImage;

    const startSplitTransition = () => {
      // Fit images to canvas (object-fit: cover)
      const fitImage = (img: HTMLImageElement) => {
        const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;
        return { dx, dy, dw, dh };
      };

      const currentFit = fitImage(currentImg);
      const nextFit = fitImage(nextImg);

      // Animation loop
      const startTime = performance.now();
      const duration = 1200; // Smooth duration for split effect

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        // Smooth easing function for natural movement
        const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedProgress = easeInOut(progress);
        
        ctx.clearRect(0, 0, W, H);

        // Draw next image as base (revealed behind the split)
        ctx.drawImage(nextImg, nextFit.dx, nextFit.dy, nextFit.dw, nextFit.dh);

        // Calculate split movement distances
        const maxMovement = H; // Maximum distance the halves will move
        const leftMovement = easedProgress * maxMovement; // Left half moves up
        const rightMovement = easedProgress * maxMovement; // Right half moves down

        // Draw left half of current image (moving up)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W / 2, H); // Clip to left half
        ctx.clip();
        
        // Draw current image shifted up
        ctx.drawImage(
          currentImg, 
          currentFit.dx, 
          currentFit.dy - leftMovement, // Move up
          currentFit.dw, 
          currentFit.dh
        );
        ctx.restore();

        // Draw right half of current image (moving down)
        ctx.save();
        ctx.beginPath();
        ctx.rect(W / 2, 0, W / 2, H); // Clip to right half
        ctx.clip();
        
        // Draw current image shifted down
        ctx.drawImage(
          currentImg, 
          currentFit.dx, 
          currentFit.dy + rightMovement, // Move down
          currentFit.dw, 
          currentFit.dh
        );
        ctx.restore();

        // Add subtle glow effect at the center split
        if (progress > 0.1 && progress < 0.9) {
          const glowIntensity = Math.sin(progress * Math.PI) * 0.3; // Peak in the middle
          const gradient = ctx.createLinearGradient(W / 2 - 20, 0, W / 2 + 20, 0);
          gradient.addColorStop(0, `rgba(255,255,255,0)`);
          gradient.addColorStop(0.5, `rgba(255,255,255,${glowIntensity})`);
          gradient.addColorStop(1, `rgba(255,255,255,0)`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(W / 2 - 20, 0, 40, H);
        }

        // Add motion blur effect for more dynamic feel
        if (progress > 0.2 && progress < 0.8) {
          const blurIntensity = Math.sin(progress * Math.PI) * 0.1;
          
          // Left half motion blur (upward)
          ctx.save();
          ctx.globalAlpha = blurIntensity;
          ctx.beginPath();
          ctx.rect(0, 0, W / 2, H);
          ctx.clip();
          ctx.drawImage(
            currentImg, 
            currentFit.dx, 
            currentFit.dy - leftMovement - 5, 
            currentFit.dw, 
            currentFit.dh
          );
          ctx.restore();

          // Right half motion blur (downward)
          ctx.save();
          ctx.globalAlpha = blurIntensity;
          ctx.beginPath();
          ctx.rect(W / 2, 0, W / 2, H);
          ctx.clip();
          ctx.drawImage(
            currentImg, 
            currentFit.dx, 
            currentFit.dy + rightMovement + 5, 
            currentFit.dw, 
            currentFit.dh
          );
          ctx.restore();
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          setCurrentSlide(nextIndex);
          setIsTransitioning(false);
          // Hide canvas to show background image
          canvas.style.opacity = '0';
        }
      };

      // Show canvas and start animation
      canvas.style.opacity = '1';
      animationRef.current = requestAnimationFrame(animate);
    };
  };

  // Auto-slide functionality with disintegration effect
  useEffect(() => {
    const interval = setInterval(() => {
      const nextSlide = (currentSlide + 1) % slides.length;
      disintegrateToSlide(nextSlide);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [currentSlide, slides.length, isTransitioning]);



  useEffect(() => {
    // Gestion de l'interaction curseur pour toute la section Hero
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculer la position relative du curseur (-1 à 1)
        const x = (e.clientX - centerX) / (rect.width / 2);
        const y = (e.clientY - centerY) / (rect.height / 2);
        
        setMousePosition({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
      }
    };

    const handleMouseLeave = () => {
      setMousePosition({ x: 0, y: 0 });
    };

    if (heroRef.current) {
      heroRef.current.addEventListener('mousemove', handleMouseMove);
      heroRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    const ctx = gsap.context(() => {
      // Timeline principale pour l'entrée
      const tl = gsap.timeline();

      // Animation du badge
      tl.fromTo(badgeRef.current, 
        { opacity: 0, y: -20, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
      );

      // Animation du titre principal avec effet de typing
      tl.fromTo(titleRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "-=0.3"
      );

      // Animation du sous-titre
      tl.fromTo(subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );

      // Animation des features
      tl.fromTo(featuresRef.current?.children || [],
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      );

      // Animation du CTA
      tl.fromTo(ctaRef.current,
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
        "-=0.2"
      );

      // Animation de la scène 3D
      tl.fromTo(scene3DRef.current,
        { opacity: 0, x: 50, rotationY: -10 },
        { opacity: 1, x: 0, rotationY: 0, duration: 1, ease: "power3.out" },
        "-=0.6"
      );

      // Animations des formes d'arrière-plan
      gsap.set(backgroundShapesRef.current?.children || [], { opacity: 0 });
      
      gsap.to(backgroundShapesRef.current?.children[0] || {}, {
        opacity: 1,
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "none"
      });

      gsap.to(backgroundShapesRef.current?.children[1] || {}, {
        opacity: 1,
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 0.5
      });

      gsap.to(backgroundShapesRef.current?.children[2] || {}, {
        opacity: 1,
        scale: 1.2,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 1
      });

      // Animation parallax au scroll
      gsap.to(heroRef.current, {
        yPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });

    }, heroRef);

    return () => {
      ctx.revert();
      if (heroRef.current) {
        heroRef.current.removeEventListener('mousemove', handleMouseMove);
        heroRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  // Calculer les rotations basées sur la position de la souris - Amplifiées pour l'effet 360°
  const rotateX = mousePosition.y * 15; // Rotation verticale max 15°
  const rotateY = mousePosition.x * 20; // Rotation horizontale max 20°

  const currentSlideData = slides[currentSlide];

  return (
    <section 
      ref={heroRef} 
      className="relative overflow-hidden min-h-screen pb-8 cursor-pointer text-white"
      style={{ perspective: '2000px', paddingTop: '250px' }}
    >
      {/* Hidden gradient background element */}
      <div className="bg-gradient-to-br from-mali-light via-white to-mali-light text-white relative overflow-hidden min-h-screen flex items-center pt-16 cursor-pointer" style={{ display: 'none' }}></div>
      {/* Background Images with Transitions and 360° Effect */}
      <div className="absolute inset-0 w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full bg-cover bg-no-repeat transition-all duration-200 ease-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${slide.backgroundImage})`,
              backgroundPosition: index === currentSlide 
                ? `${50 + mousePosition.x * 5}% ${50 + mousePosition.y * 5}%` 
                : 'center center',
              transform: index === currentSlide 
                ? `scale(${1 + Math.abs(mousePosition.x + mousePosition.y) * 0.08}) rotateZ(${mousePosition.x * 2}deg) rotateX(${mousePosition.y * 3}deg) rotateY(${mousePosition.x * 3}deg)` 
                : 'scale(1)',
              transformOrigin: 'center center',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Dark overlay for better text visibility */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ))}
        {/* Canvas for Disintegration Effect */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-40 opacity-0 transition-opacity duration-300"
          style={{ 
            mixBlendMode: 'normal',
            imageRendering: 'pixelated'
          }}
        />
        {/* Overlay gradient with 360° effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-investmali-primary/70 via-investmali-primary/50 to-investmali-primary/70 transition-transform duration-200 ease-out"
          style={{
            transform: `rotateX(${mousePosition.y * 2}deg) rotateY(${mousePosition.x * 2}deg)`,
            transformStyle: 'preserve-3d'
          }}
        ></div>
      </div>
      {/* Animated background shapes harmonized with background images */}
      <div 
        ref={backgroundShapesRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none select-none transition-transform duration-200 ease-out z-10"
        style={{
          transform: `rotateX(${-rotateX * 0.2}deg) rotateY(${rotateY * 0.3}deg)`,
          transformStyle: 'preserve-3d',
          opacity: 0.6
        }}
      >
        <div 
          className="absolute top-20 left-10 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full border border-investmali-accent/30 transition-transform duration-200 ease-out"
          style={{
            transform: `translateZ(${mousePosition.x * 15}px) rotateZ(${mousePosition.x * 30}deg) scale(${1 + Math.abs(mousePosition.x) * 0.15})`,
            boxShadow: `0 0 20px rgba(89, 175, 71, ${0.3 + Math.abs(mousePosition.x) * 0.2})`
          }}
        ></div>
        <div 
          className="absolute top-40 right-20 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full border border-investmali-secondary/30 transition-transform duration-200 ease-out"
          style={{
            transform: `translateZ(${-mousePosition.y * 12}px) rotateZ(${-mousePosition.y * 25}deg) scale(${1 + Math.abs(mousePosition.y) * 0.2})`,
            boxShadow: `0 0 20px rgba(197, 1, 0, ${0.3 + Math.abs(mousePosition.y) * 0.2})`
          }}
        ></div>
        <div 
          className="absolute bottom-20 left-1/4 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full border border-white/30 transition-transform duration-200 ease-out"
          style={{
            transform: `translateZ(${mousePosition.x * mousePosition.y * 20}px) rotateZ(${(mousePosition.x + mousePosition.y) * 45}deg) scale(${1 + Math.abs(mousePosition.x + mousePosition.y) * 0.25})`,
            boxShadow: `0 0 15px rgba(255, 255, 255, ${0.2 + Math.abs(mousePosition.x + mousePosition.y) * 0.3})`
          }}
        ></div>
        <svg 
          className="absolute bottom-0 left-0 w-full h-64 opacity-10 transition-transform duration-200 ease-out" 
          viewBox="0 0 1440 320"
          style={{
            transform: `rotateX(${rotateX * 0.1}deg) translateZ(${mousePosition.y * 5}px)`
          }}
        >
          <path 
            fill="#FFFFFF" 
            fillOpacity="0.2" 
            d="M0,160L60,186.7C120,213,240,267,360,261.3C480,256,600,192,720,186.7C840,181,960,235,1080,229.3C1200,224,1320,160,1380,128L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
        </svg>
      </div>


      
      <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50 transition-transform duration-200 ease-out mt-32"
        style={{
          transform: `rotateX(${-rotateX * 0.5}deg) rotateY(${rotateY * 0.7}deg) translateZ(${Math.abs(mousePosition.x + mousePosition.y) * 20}px)`,
          transformStyle: 'preserve-3d'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contenu textuel */}
          <div className="space-y-8">
            {/* Badge animé */}
            <div 
              ref={badgeRef} 
              className="inline-flex items-center px-6 py-3 bg-investmali-accent/20 rounded-full border-2 border-investmali-accent/40 backdrop-blur-sm shadow-lg transition-all duration-200 ease-out"
              style={{
                transform: `translateZ(${mousePosition.x * 15}px) rotateZ(${mousePosition.x * 8}deg) rotateX(${mousePosition.y * 5}deg) scale(${1 + Math.abs(mousePosition.x) * 0.1})`,
                boxShadow: '0 8px 32px rgba(89, 175, 71, 0.3)'
              }}
            >
              <span className="w-3 h-3 bg-investmali-accent rounded-full mr-3 animate-pulse shadow-sm"></span>
              <span className="text-investmali-accent font-bold text-base tracking-wide">{currentSlideData.badge}</span>
            </div>
            
            <h1 
              ref={titleRef} 
              className="text-5xl lg:text-6xl font-extrabold leading-tight text-white transition-all duration-200 ease-out"
              style={{
                transform: `translateZ(${mousePosition.y * 25}px) rotateX(${mousePosition.y * 8}deg) rotateY(${mousePosition.x * 6}deg) scale(${1 + Math.abs(mousePosition.y) * 0.05})`
              }}
            >
              {currentSlideData.title.split(' ').map((word, index) => (
                <span key={index} className={index === 1 ? "text-mali-emerald relative" : index === currentSlideData.title.split(' ').length - 1 ? "text-mali-gold" : ""}>
                  {word}
                  {index === 1 && (
                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-mali-gold/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0,8 Q50,0 100,8" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  )}
                  {index < currentSlideData.title.split(' ').length - 1 && ' '}
                </span>
              ))}
            </h1>
            
            <p 
              ref={subtitleRef} 
              className="text-xl leading-relaxed text-white/90 transition-all duration-200 ease-out"
              style={{
                transform: `translateZ(${-mousePosition.x * 12}px) rotateY(${mousePosition.x * 4}deg) rotateX(${mousePosition.y * 2}deg) scale(${1 + Math.abs(mousePosition.x) * 0.03})`
              }}
            >
              {currentSlideData.subtitle}
            </p>

            {/* Features principales */}
            <div 
              ref={featuresRef} 
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 transition-transform duration-200 ease-out"
              style={{
                transform: `translateZ(${mousePosition.y * 18}px) rotateX(${mousePosition.y * 6}deg) rotateY(${mousePosition.x * 3}deg) scale(${1 + Math.abs(mousePosition.y) * 0.04})`
              }}
            >
              <div className="flex items-center gap-3 group bg-white/50 backdrop-blur-sm p-4 rounded-xl hover:bg-white/70 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-mali-emerald to-mali-emerald/80 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Création en 24h</h3>
                  <p className="text-sm text-gray-700">Processus simplifié</p>
                </div>
              </div>

              <div className="flex items-center gap-3 group bg-white/50 backdrop-blur-sm p-4 rounded-xl hover:bg-white/70 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-mali-gold to-mali-gold/80 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Paiement sécurisé</h3>
                  <p className="text-sm text-gray-700">Transactions protégées</p>
                </div>
              </div>

              <div className="flex items-center gap-3 group bg-white/50 backdrop-blur-sm p-4 rounded-xl hover:bg-white/70 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Support 24/7</h3>
                  <p className="text-sm text-gray-700">Accompagnement continu</p>
                </div>
              </div>

              <div className="flex items-center gap-3 group bg-white/50 backdrop-blur-sm p-4 rounded-xl hover:bg-white/70 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Innovation digitale</h3>
                  <p className="text-sm text-gray-700">Solutions technologiques</p>
                </div>
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div 
              ref={ctaRef} 
              className="flex flex-col sm:flex-row gap-4 transition-all duration-200 ease-out"
              style={{
                transform: `translateZ(${mousePosition.x * 22}px) rotateY(${mousePosition.x * 7}deg) rotateX(${mousePosition.y * 4}deg) scale(${1 + Math.abs(mousePosition.x + mousePosition.y) * 0.06})`
              }}
            >
              <Link to="/create-business" className="group relative px-8 py-4 bg-gradient-to-r from-mali-emerald to-mali-emerald/90 text-white rounded-xl font-semibold text-lg hover:from-mali-emerald/90 hover:to-mali-emerald transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden text-center">
                <span className="relative z-10">{currentSlideData.cta}</span>
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Link>
              <button className="group relative px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-mali-emerald rounded-xl font-semibold text-lg hover:bg-mali-emerald hover:text-white transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                <span className="relative z-10">Découvrir nos services</span>
              </button>
            </div>

            {/* Slider Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {/* Slide Indicators */}
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => disintegrateToSlide(index)}
                    disabled={isTransitioning}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-mali-emerald scale-125' 
                        : 'bg-mali-emerald/30 hover:bg-mali-emerald/60'
                    } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                ))}
              </div>
              
              {/* Navigation Arrows */}
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => disintegrateToSlide((currentSlide - 1 + slides.length) % slides.length)}
                  disabled={isTransitioning}
                  className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-mali-emerald/30 flex items-center justify-center text-mali-emerald hover:bg-mali-emerald hover:text-white transition-all duration-300 ${
                    isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => disintegrateToSlide((currentSlide + 1) % slides.length)}
                  disabled={isTransitioning}
                  className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-mali-emerald/30 flex items-center justify-center text-mali-emerald hover:bg-mali-emerald hover:text-white transition-all duration-300 ${
                    isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Scène 3D interactive */}
          <div ref={scene3DRef} style={{ display: 'none' }}>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
              <Homepage3D />
              <div className="text-center mt-4">
                <p className="text-sm text-mali-dark/70 font-medium">
                  Expérience 3D interactive - Démarrez votre entreprise
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
