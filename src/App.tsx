import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Values from './components/Values';
//import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { useScrollReveal } from './hooks/useScrollReveal';

export default function App() {
  useScrollReveal();

  useEffect(() => {
    document.title = 'TEXTUM — Mentoría Académica';
  }, []);

  return (
    <div className="relative">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Values />
      //
      <Contact />
      <Footer />
    </div>
  );
}
