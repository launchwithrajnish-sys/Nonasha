import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, Menu, X, Leaf, Zap, Activity, Clock, MapPin, Sparkles, ArrowUpRight, Instagram, Twitter, Facebook, Mail, Phone, Star, Shield, ThumbsUp, Package, UserCircle } from 'lucide-react';
import CartPage from './components/CartPage';
import OrderSuccess from './components/OrderSuccess';
import OrderTracking from './components/OrderTracking';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthOverlay from './components/AuthOverlay';
import AIChat from './components/AIChat';
import ProfileSection from './components/ProfileSection';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [view, setView] = useState<'home' | 'cart' | 'success' | 'track' | 'profile' | 'admin'>('home');
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const adminEmail = 'launchwithrajnish@gmail.com';
  const isAdmin = user?.email === adminEmail;
  const [cartItems, setCartItems] = useState<any[]>([
    {
      id: '1',
      name: 'NO NASHA™ Anti Addiction Drops',
      price: 599,
      quantity: 1,
      image: '/cartimg/Untitled design (7).png',
      size: '30ml bottle'
    }
  ]);

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setView('cart');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const navigateToSection = (sectionId: string) => {
    if (view !== 'home') {
      setView('home');
      // Wait for re-render before scrolling
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Check if we just came back from Stripe
    if (window.location.pathname === '/order-success') {
      setView('success');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (view === 'cart') {
    return (
      <div className="relative min-h-screen bg-[#FDFDFD]">
        {/* Header (Shared logic for Cart View) */}
        <div className="fixed top-4 md:top-8 left-0 right-0 z-50 flex justify-center px-4 md:px-8">
          <header className={`w-full max-w-7xl transition-all duration-500 rounded-full border ${
            scrolled ? 'bg-white/95 backdrop-blur-md py-2 md:py-3 border-neutral-100 shadow-xl' : 'bg-white/40 backdrop-blur-sm py-3 md:py-4 border-neutral-100'
          }`}>
            <div className="px-6 md:px-8 flex items-center justify-between">
              <div onClick={() => setView('home')} className="flex items-center gap-2 group cursor-pointer text-brand-dark">
                <Leaf className="text-brand-leaf fill-brand-leaf transition-transform group-hover:rotate-12" size={20} />
                <span className="text-lg md:text-xl font-extrabold tracking-tighter uppercase">
                  NO NASHA<span className="text-brand-leaf/40">™</span>
                </span>
              </div>

              <nav className="hidden md:flex items-center gap-8 lg:gap-12">
                {[
                  { name: 'Home', action: () => setView('home') },
                  { name: 'Track', action: () => setView('track') },
                  { name: 'About', action: () => navigateToSection('alchemy') }
                ].map((item) => (
                  <button 
                    key={item.name} 
                    onClick={item.action}
                    className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40 hover:text-brand-leaf transition-colors"
                  >
                    {item.name}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                {isAdmin && (
                  <button 
                    onClick={() => setView('admin')}
                    className="text-[10px] font-black uppercase tracking-widest text-brand-leaf hover:text-brand-dark transition-colors"
                  >
                    Admin
                  </button>
                )}
                {user ? (
                  <button 
                    onClick={() => setView('profile')}
                    className="p-2 text-brand-dark hover:bg-neutral-100 rounded-full transition-colors flex items-center gap-2"
                  >
                    <UserCircle size={24} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-brand-dark hover:text-brand-leaf transition-colors mr-2"
                  >
                    Login
                  </button>
                )}
                <button 
                  onClick={() => setView(view === 'cart' ? 'home' : 'cart')}
                  className="bg-brand-dark text-white px-5 md:px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
                >
                  {view === 'cart' ? 'Back' : `Cart (${cartItems.reduce((acc, item) => acc + item.quantity, 0)})`}
                </button>
              </div>
            </div>
          </header>
        </div>

        <CartPage 
          onBack={() => setView('home')} 
          onSuccess={(orderId) => {
            setActiveOrderId(orderId);
            setView('success');
            setCartItems([]); // Clear cart on success
          }}
          cartItems={cartItems}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
        />
        <AIChat />
        <AuthOverlay isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <Footer setView={setView} navigateToSection={navigateToSection} />
      </div>
    );
  }

  if (view === 'success') {
    return (
      <>
        <OrderSuccess onHome={() => setView('home')} onTrack={(id) => { setActiveOrderId(id); setView('track'); }} />
        <AIChat />
      </>
    );
  }

  if (view === 'track') {
    return (
      <div className="relative min-h-screen bg-[#FDFDFD]">
        <Header scrolled={scrolled} setView={setView} user={user} openAuth={() => setIsAuthOpen(true)} cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} navigateToSection={navigateToSection} />
        <OrderTracking onBack={() => setView('home')} />
        <AIChat />
        <AuthOverlay isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <Footer setView={setView} navigateToSection={navigateToSection} />
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <div className="relative min-h-screen bg-[#FDFDFD]">
        <Header scrolled={scrolled} setView={setView} user={user} openAuth={() => setIsAuthOpen(true)} cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} navigateToSection={navigateToSection} />
        <ProfileSection onLogout={() => setView('home')} />
        <AIChat />
        <AuthOverlay isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <Footer setView={setView} navigateToSection={navigateToSection} />
      </div>
    );
  }

  if (view === 'admin') {
    if (!isAdmin) {
      setView('home');
      return null;
    }
    return (
      <div className="relative min-h-screen bg-[#FDFDFD]">
        <AdminDashboard onBack={() => setView('home')} />
        <AIChat />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-brand-dark font-sans selection:bg-white/20">
      <AIChat />
      <AuthOverlay isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      {/* Background Image Wrapper - Full Screen */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/herooo/heroo.png" 
          alt="NONASHA Wellness" 
          className="object-cover object-center w-full h-[900px]"
        />
        {/* <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/60 via-brand-dark/20 to-brand-dark/80 lg:bg-gradient-to-r lg:from-brand-dark/80 lg:via-brand-dark/40 lg:to-transparent" /> */}
      </div>

      {/* Modern Slim Header */}
      <div className="fixed top-4 md:top-8 left-0 right-0 z-50 flex justify-center px-4 md:px-8">
        <header className={`w-full max-w-7xl transition-all duration-500 rounded-full border border-white/10 ${
          scrolled ? 'bg-brand-dark/95 backdrop-blur-md py-2 md:py-3 shadow-2xl' : 'bg-brand-dark/40 backdrop-blur-sm py-3 md:py-4'
        }`}>
          <div className="px-6 md:px-8 flex items-center justify-between text-white">
            <div onClick={() => setView('home')} className="flex items-center gap-2 group cursor-pointer">
              <Leaf className="text-white fill-white transition-transform group-hover:rotate-12" size={20} />
              <span className="text-lg md:text-xl font-extrabold tracking-tighter uppercase">
                NO NASHA<span className="text-white/60">™</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 lg:gap-12 text-white/50">
              {[
                { name: 'Home', action: () => setView('home') },
                { name: 'Track Order', action: () => setView('track') },
                { name: 'About', action: () => navigateToSection('alchemy') }
              ].map((item) => (
                <button 
                  key={item.name} 
                  onClick={item.action}
                  className="text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  {item.name}
                </button>
              ))}
              {isAdmin && (
                <button 
                  onClick={() => setView('admin')}
                  className="text-[10px] font-black uppercase tracking-widest text-brand-leaf hover:text-white transition-colors"
                >
                  Admin Panel
                </button>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <button 
                  onClick={() => setView('profile')}
                  className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <UserCircle size={24} />
                </button>
              ) : (
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors mr-2"
                >
                  Login
                </button>
              )}
              <button 
                onClick={() => setView('cart')}
                className="bg-white text-brand-dark px-5 md:px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
              >
                Cart ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})
              </button>
              <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-white p-1 hover:bg-white/10 rounded-full transition-colors"><Menu size={24} /></button>
            </div>
          </div>
        </header>
      </div>

      {/* Hero Content Area */}
      <main className="relative z-10 mx-auto max-w-[1800px] min-h-screen flex flex-col justify-center pt-32 pb-20 px-10 lg:px-24">
        <div className="w-full lg:w-1/2 flex flex-col items-start">
          <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8 pl-0.5 pt-2.5">
            <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 md:px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Gain Clarity</motion.span>
            <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 md:px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Manage Cravings</motion.span>
          </div>
          
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-white mb-8 leading-[0.9]">
            Ayurvedic Anti <br /> Addiction Drops
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="max-w-sm lg:max-w-md">
            <p className="text-white/70 text-lg md:text-xl font-medium leading-relaxed mb-10">
              NONASHA™ combines powerful Ayurvedic herbs to help reduce cravings and restore internal balance — naturally.
            </p>
            <motion.button 
              onClick={() => addToCart({
                id: '1',
                name: 'NONASHA™ Anti Addiction Drops',
                price: 599,
                image: '/cartimg/Untitled design (7).png',
                size: '30ml bottle'
              })} 
              whileHover={{ scale: 1.02 }} 
              className="bg-white text-brand-dark px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-2xl shadow-white/5 transition-all group active:translate-y-1"
            >
              Order Yours Now <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 underline" />
            </motion.button>
          </motion.div>
        </div>
      </main>

      {/* Section: Transformation */}
      <section id="transformation" className="relative z-10 bg-white text-brand-dark py-24 lg:py-40 px-10 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-brand-leaf text-[10px] font-black uppercase tracking-[0.4em] mb-4 block underline underline-offset-8">Our Philosophy</span>
              <h2 className="text-4xl md:text-6xl font-medium tracking-tighter mb-10 leading-[0.95] text-neutral-900 leading-tight">
                Modern Recovery <br /> <span className="italic text-brand-leaf font-serif italic">Rooted in Tradition.</span>
              </h2>
              <p className="text-brand-dark/60 text-lg leading-relaxed mb-8 max-w-xl">
                 At NONASHA™, we help individuals overcome modern addictions—alcohol, nicotine, tobacco, and caffeine—using the purest Ayurvedic principles. We target the biological roots of addiction—neuro-imbalance and metabolic toxicity.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-12">
                 {[
                   { label: 'Deep Detox', icon: <Sparkles size={16} /> },
                   { label: 'Neural Balance', icon: <Activity size={16} /> },
                   { label: 'Craving Control', icon: <Shield size={16} /> },
                   { label: 'Zero Chemicals', icon: <Leaf size={16} /> }
                 ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-brand-dark/30 hover:text-brand-leaf transition-colors cursor-default group">
                       <span className="text-brand-leaf group-hover:scale-110 transition-transform">{item.icon}</span> {item.label}
                    </div>
                 ))}
              </div>
              <button onClick={() => setView('cart')} className="bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] px-10 py-5 rounded-2xl hover:bg-neutral-800 transition-all shadow-xl shadow-black/10">Shop Now</button>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="aspect-square bg-neutral-50 rounded-[64px] overflow-hidden border border-neutral-100 flex items-center justify-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] relative group">
                <div className="absolute inset-0 bg-brand-leaf/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <motion.img 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  src="/cartimg/Untitled design (7).png" 
                  alt="Nonasha Product" 
                  className="w-full h-full object-cover relative z-10" 
                />
            </motion.div>
        </div>
      </section>

      {/* Section: Quality Trust Labels */}
      <section className="relative z-10 bg-neutral-50 py-16 px-10 border-y border-neutral-100 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           {['100% AYURVEDIC', 'GMP CERTIFIED', 'AYUSH REGULATED', 'NO SIDE EFFECTS', 'LAB TESTED', 'NON-HABIT FORMING'].map(label => (
             <span key={label} className="text-[11px] font-black tracking-[0.4em] uppercase whitespace-nowrap">{label}</span>
           ))}
        </div>
      </section>

      {/* Section: Ingredients Spotlight */}
      <section id="alchemy" className="relative z-10 bg-brand-dark text-white py-24 lg:py-40 px-10 lg:px-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-2/3 h-full bg-brand-leaf/5 blur-[150px] rounded-full -mr-96" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-24">
            <div className="max-w-2xl">
              <span className="text-brand-leaf text-[10px] font-black uppercase tracking-[0.5em] mb-6 block font-serif italic text-white/50">Core Elements</span>
              <h2 className="text-5xl md:text-7vw lg:text-7xl font-medium tracking-tighter leading-[0.95] mb-8">Pure Extracts. <br /> <span className="italic text-brand-leaf font-serif">Deep Restoration.</span></h2>
              <p className="text-white/30 text-lg font-medium max-w-lg leading-relaxed mb-10">Our proprietary extraction process isolates bioactive compounds at the molecular level, ensuring that every drop contains the full potency of nature's design.</p>
              <button 
                onClick={() => setView('cart')}
                className="bg-brand-leaf text-white text-[10px] font-black uppercase tracking-[0.3em] px-10 py-5 rounded-2xl hover:bg-brand-leaf/80 transition-all shadow-xl shadow-brand-leaf/10"
              >
                Shop Now
              </button>
            </div>
            <motion.button onClick={() => setView('cart')} whileHover={{ x: 10 }} className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all group border border-white/5 py-4 px-8 rounded-full">
              Full Ingredient Library <ArrowUpRight size={18} className="text-brand-leaf group-hover:rotate-45 transition-transform" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Brahmi", role: "Brain Tonic", desc: "Neuro-Support: It targets neurons to calm the nervous system and clear mental fog induced by withdrawals.", img: "/src/assets/images/brahmi_leaf_1779009661642.png" },
              { title: "Giloy", role: "Immuno-Detox", desc: "Scientific Detoxification: A powerful immunomodulator that actively sweeps chemicals from your bloodstream.", img: "/src/assets/images/giloy_stem_1779009678538.png" },
              { title: "Amla", role: "Antioxidant", desc: "Cellular Nutrition: The richest source of Vitamin C, acting as a scavenger for free radicals caused by stress.", img: "/src/assets/images/amla_fruit_1779009693697.png" },
              { title: "Kalmegh", role: "Liver Care", desc: "Vitality Support: Rejuvenates the liver tissues and restores original metabolic pathways for energy.", img: "/src/assets/images/kalmegh_herb_1779009707861.png" }
            ].map((ing, i) => (
              <motion.div 
                key={ing.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative h-[500px] rounded-[56px] border border-white/5 group overflow-hidden flex flex-col justify-end"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={ing.img} 
                    alt={ing.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent group-hover:from-brand-dark group-hover:via-brand-dark/40 transition-all duration-500" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-10 lg:p-12">
                  <h4 className="text-4xl font-bold mb-3 tracking-tight">{ing.title}</h4>
                  <p className="text-[10px] text-brand-leaf font-black uppercase tracking-widest mb-8">{ing.role}</p>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-2">Benefit Insight</p>
                    <p className="text-white/80 text-sm font-medium leading-relaxed">{ing.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Science / How it Works */}
      <section id="process" className="relative z-10 bg-white py-24 lg:py-40 px-10 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="order-2 lg:order-1">
            <div className="space-y-20">
              {[
                { step: "01", title: "Neural Synchronization", desc: "The bioactive compounds cross the blood-brain barrier to gently re-calibrate receptor sensitivity, dampening the intensity of physiological cravings." },
                { step: "02", title: "Bitters Intervention", desc: "Natural bitters trigger the G-protein receptors in the gut, signaling the liver to begin a deep enzymatic purification of the body's internal environment." },
                { step: "03", title: "Homeostatic Return", desc: "Adaptogens like Ashwagandha regulate cortisol and adrenaline levels, helping you regain emotional stability and clear decision-making power." }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }} 
                  whileInView={{ opacity: 1, x: 0 }}
                  className="flex gap-10 group"
                >
                  <span className="text-6xl font-black text-brand-leaf/10 group-hover:text-brand-leaf/30 transition-colors leading-none font-serif">{item.step}</span>
                  <div className="pt-2">
                    <h3 className="text-3xl font-bold mb-5 tracking-tight text-neutral-800">{item.title}</h3>
                    <p className="text-brand-dark/40 text-base font-medium leading-relaxed max-w-md">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-brand-leaf text-[10px] font-black uppercase tracking-[0.5em] mb-6 block font-serif italic">Scientific Path</span>
            <h2 className="text-5xl md:text-7xl font-medium tracking-tighter text-neutral-900 mb-10 leading-[0.9]">The Biological <br /> <span className="italic text-brand-leaf font-serif">Mechanism.</span></h2>
            <p className="text-brand-dark/50 text-xl font-medium leading-relaxed mb-16 max-w-lg">We don't believe in quick fixes. Our three-phase approach ensures that the recovery is as deep as the biology it restores.</p>
            <button 
              onClick={() => setView('cart')}
              className="mb-10 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] px-10 py-5 rounded-2xl hover:bg-neutral-800 transition-all shadow-xl shadow-black/10"
            >
              Shop Now
            </button>
            <div className="w-full aspect-[4/5] bg-neutral-50 rounded-[80px] border border-neutral-100 flex items-center justify-center relative overflow-hidden shadow-[0_50px_100px_-30px_rgba(0,0,0,0.08)]">
               <div className="absolute inset-0 bg-gradient-to-tr from-brand-leaf/5 to-transparent pointer-events-none" />
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-leaf/5 blur-[80px] rounded-full -mr-32 -mt-32" />
               <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full relative z-10"
               >
                 <img src="/cartimg/Untitled design (7).png" alt="Mechanism Preview" className="w-full h-full object-cover" />
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Benefits Grid */}
      <section className="relative z-10 bg-neutral-50 text-brand-dark py-24 lg:py-40 px-10 lg:px-24 border-y border-neutral-100 overflow-hidden">
        {/* Floating background effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
          <motion.div 
            animate={{ 
              x: [0, 100, 0],
              y: [0, 50, 0],
              rotate: [0, 45, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-brand-leaf/10 blur-[100px] rounded-full"
          />
          <motion.div 
            animate={{ 
              x: [0, -100, 0],
              y: [0, -50, 0],
              rotate: [0, -45, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-leaf/10 blur-[100px] rounded-full"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <span className="text-brand-leaf text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Why Nonasha?</span>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-neutral-900">Total Wellness <span className="italic">Support</span></h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Zap size={32} />, title: "Instant Relief", desc: "Formulated to help curb immediate cravings through natural neurological signaling." },
              { icon: <Shield size={32} />, title: "Immune Boost", desc: "Enriched with antioxidants like Amla and Giloy to strengthen your body's base." },
              { icon: <ThumbsUp size={32} />, title: "Zero Side Effects", desc: "100% Ayurvedic, non-habit forming, and free from chemical stimulants." }
            ].map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: idx * 0.2, 
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
                className="bg-white p-12 rounded-[40px] border border-neutral-100 shadow-xl shadow-black/[0.02] hover:shadow-2xl hover:shadow-brand-leaf/5 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-leaf/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <motion.div 
                  className="text-brand-leaf mb-8 relative z-10"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  {benefit.icon}
                </motion.div>
                
                <h3 className="text-2xl font-bold mb-4 tracking-tight relative z-10 group-hover:text-brand-leaf transition-colors duration-500">{benefit.title}</h3>
                <p className="text-brand-dark/40 text-sm font-medium leading-relaxed relative z-10 group-hover:text-brand-dark/70 transition-colors duration-500">{benefit.desc}</p>
                
                <div className="mt-10 pt-8 border-t border-neutral-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-leaf opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 relative z-10">
                   Lear more <ArrowRight size={12} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Usage and FAQ */}
      <section className="relative z-10 bg-brand-dark py-24 lg:py-40 px-10 lg:px-24 border-t border-white/5 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32">
          <div>
            <span className="text-brand-leaf text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">Usage Protocol</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tighter mb-12">The Path to <span className="italic text-brand-leaf font-serif">Freedom.</span></h2>
            <div className="space-y-12">
               {[
                 { q: "How to use Nonasha Drops?", a: "Add 2–3 drops to a glass of lukewarm water. Consume 3–4 times daily for maximum absorption. Consistency is the key to cellular restoration." },
                 { q: "Is it safe for long term use?", a: "Yes, our formulation is 100% Ayurvedic and non-habit forming. We recommend a 90-day protocol for a complete systemic reset." },
                 { q: "Who should avoid it?", a: "Pregnant women and nursing mothers should consult their physician before use. Not intended for children under 12." }
               ].map((item, i) => (
                 <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="group">
                    <h4 className="text-lg font-bold mb-3 flex items-center gap-4">
                       <span className="w-6 h-6 rounded-full border border-brand-leaf/30 flex items-center justify-center text-[10px] text-brand-leaf">{i+1}</span>
                       {item.q}
                    </h4>
                    <p className="text-white/40 text-sm font-medium leading-relaxed ml-10 group-hover:text-white/60 transition-colors">{item.a}</p>
                 </motion.div>
               ))}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[56px] border border-white/5">
             <Clock className="text-brand-leaf mb-8" size={32} />
             <h3 className="text-2xl font-bold mb-8">90-Day Transformation Cycle</h3>
             <div className="space-y-8">
                <div className="flex gap-6">
                   <div className="w-1 bg-brand-leaf/20 rounded-full h-24 mt-2">
                      <div className="w-full bg-brand-leaf h-1/3 rounded-full" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-brand-leaf uppercase mb-2">Phase 01: Week 1-3</p>
                      <h5 className="text-lg font-bold mb-2">The Detox Pulse</h5>
                      <p className="text-white/30 text-sm font-medium leading-relaxed">Biological washout of accumulated toxins begins. You may feel a slight shift in mental clarity as the system purges.</p>
                   </div>
                </div>
                <div className="flex gap-6">
                   <div className="w-1 bg-brand-leaf/20 rounded-full h-24 mt-2">
                      <div className="w-full bg-brand-leaf h-2/3 rounded-full" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-brand-leaf uppercase mb-2">Phase 02: Week 4-8</p>
                      <h5 className="text-lg font-bold mb-2">Neural Balance</h5>
                      <p className="text-white/30 text-sm font-medium leading-relaxed">Cravings diminish significantly as neurotransmitters stabilize. Natural energy levels begin to return to baseline.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Section: Testimonials/Reviews preview */}
      <section id="reviews" className="relative z-10 bg-white text-brand-dark py-24 lg:py-40 px-10 lg:px-24 border-y border-neutral-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <span className="text-brand-leaf text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Voice of Resilience</span>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-neutral-900 italic">Real People. <span className="text-brand-leaf">Real Balance.</span></h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {[
              {
                text: "NONASHA has been a game-changer for my daily routine. The natural approach gave me the clarity I needed without any crashes. Highly recommended for anyone seeking internal balance.",
                author: "Arjun K.",
                role: "Verified Customer"
              },
              {
                text: "I was skeptical about Ayurvedic solutions until I tried these drops. Within 2 weeks, I felt a significant shift in my focus and a noticeable reduction in afternoon jitters.",
                author: "Priya S.",
                role: "Daily User"
              }
            ].map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="bg-neutral-50 p-12 rounded-[48px] border border-neutral-100 italic"
              >
                <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} className="fill-brand-leaf text-brand-leaf" />)}
                </div>
                <p className="text-xl md:text-2xl font-medium tracking-tight text-neutral-800 leading-snug mb-10">
                  "{review.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[10px] font-black text-brand-leaf border border-neutral-100">
                    {review.author[0]}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-brand-dark">{review.author}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/30">{review.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer setView={setView} navigateToSection={navigateToSection} />

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-brand-dark flex flex-col items-center justify-center p-8 text-white">
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8 p-4 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
            {[
              { name: 'Home', action: () => setView('home') },
              { name: 'Track Order', action: () => setView('track') },
              { name: 'Shop Now', action: () => setView('cart') }
            ].map((item) => (
              <button 
                key={item.name} 
                onClick={() => {
                  item.action();
                  setIsMenuOpen(false);
                }}
                className="text-4xl font-black py-4 hover:text-brand-leaf transition-colors uppercase tracking-[0.2em]"
              >
                {item.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function Header({ scrolled, setView, user, openAuth, cartCount, navigateToSection }: any) {
  return (
    <div className="fixed top-4 md:top-8 left-0 right-0 z-50 flex justify-center px-4 md:px-8">
      <header className={`w-full max-w-7xl transition-all duration-500 rounded-full border ${
        scrolled ? 'bg-white/95 backdrop-blur-md py-2 md:py-3 border-neutral-100 shadow-xl' : 'bg-white/40 backdrop-blur-sm py-3 md:py-4 border-neutral-100'
      }`}>
        <div className="px-6 md:px-8 flex items-center justify-between">
          <div onClick={() => setView('home')} className="flex items-center gap-2 group cursor-pointer text-brand-dark">
            <Leaf className="text-brand-leaf fill-brand-leaf transition-transform group-hover:rotate-12" size={20} />
            <span className="text-lg md:text-xl font-extrabold tracking-tighter uppercase">
              NO NASHA<span className="text-brand-leaf/40">™</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            {[
              { name: 'Home', action: () => setView('home') },
              { name: 'Track', action: () => setView('track') },
              { name: 'About', action: () => navigateToSection('alchemy') }
            ].map((item) => (
              <button 
                key={item.name} 
                onClick={item.action}
                className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40 hover:text-brand-leaf transition-colors"
              >
                {item.name}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <button 
                onClick={() => setView('profile')}
                className="p-2 text-brand-dark hover:bg-neutral-100 rounded-full transition-colors flex items-center gap-2"
              >
                <UserCircle size={24} />
              </button>
            ) : (
              <button 
                onClick={openAuth}
                className="text-[10px] font-black uppercase tracking-widest text-brand-dark hover:text-brand-leaf transition-colors mr-2"
              >
                Login
              </button>
            )}
            <button 
              onClick={() => setView('cart')}
              className="bg-brand-dark text-white px-5 md:px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
            >
              Cart ({cartCount})
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

function Footer({ setView, navigateToSection }: { setView: (v: any) => void, navigateToSection: (id: string) => void }) {
  return (
    <footer className="relative z-10 bg-brand-dark pt-32 pb-16 px-10 lg:px-24 overflow-hidden text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 mb-32">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <Leaf size={32} className="text-white fill-white" />
              <span className="text-3xl font-black tracking-tighter uppercase">NO NASHA</span>
            </div>
            <p className="text-white/30 text-sm font-medium leading-relaxed max-w-xs uppercase tracking-widest">Modern Ayurvedic Solutions for Modern Addictions.</p>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-white/20">Company</h5>
              <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-white/50">
                 <button onClick={() => navigateToSection('transformation')} className="hover:text-white transition-colors text-left">About Us</button>
                 <button onClick={() => setView('track')} className="hover:text-white transition-colors text-left">Track Order</button>
                 <button onClick={() => setView('cart')} className="hover:text-white transition-colors text-left">Shop Online</button>
              </div>
            </div>
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-white/20">Legal</h5>
              <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-white/50">
                 <a href="#" className="hover:text-white transition-colors">Privacy</a>
                 <a href="#" className="hover:text-white transition-colors">Terms</a>
                 <a href="#" className="hover:text-white transition-colors">Policy</a>
              </div>
            </div>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-white/20">Community</h5>
            <div className="flex gap-6">
              <Instagram size={20} className="hover:text-brand-leaf cursor-pointer transition-colors" /> 
              <Twitter size={20} className="hover:text-brand-leaf cursor-pointer transition-colors" /> 
              <Facebook size={20} className="hover:text-brand-leaf cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/10 gap-8">
           <p>© 2026 NO NASHA WELLNESS PRIVATE LIMITED.</p>
           <div className="flex gap-8">
              <span>MADE IN INDIA</span>
              <span className="text-white/20">STAY INSPIRED</span>
           </div>
        </div>
      </div>
    </footer>
  );
}

