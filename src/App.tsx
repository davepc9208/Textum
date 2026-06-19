import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Values from './components/Values';
import Contact from './components/Contact';
import Footer from './components/Footer';
import BlogPage from './pages/BlogPage';
import PostPage from './pages/PostPage';
import AdminPage from './pages/AdminPage';
import { useScrollReveal } from './hooks/useScrollReveal';

function HomePage() {
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
      <Contact />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<PostPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
