import React from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import LookQuiz from '@/components/LookQuiz';
import QuoteForm from '@/components/QuoteForm';
import GroupCalculator from '@/components/GroupCalculator';
import Products from '@/components/Products';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import Seo from '@/components/Seo';
import WelcomeTutorial from '@/components/WelcomeTutorial';
import { SiteDataProvider, AppearanceApplier, useSiteData } from '@/contexts/SiteDataContext';

function HomeContent() {
  const { site, loading } = useSiteData();

  // Mientras se carga la configuración vigente desde el backend se muestra
  // un estado de carga limpio. Así nunca se renderiza primero contenido
  // viejo, datos de ejemplo ni valores predeterminados antiguos: al entrar
  // o recargar el sitio se presenta exclusivamente la configuración activa
  // guardada desde /admin.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-secondary border-t-primary"
          role="status"
          aria-label="Cargando contenido"
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${site.name} · Maquillaje profesional en Guadalajara`}</title>
        <meta
          name="description"
          content="Maquillista profesional en Guadalajara, Jalisco. Maquillaje para bodas, XV años, graduaciones, sesiones de fotos y eventos sociales. Agenda tu cita y pide tu cotización."
        />
      </Helmet>
      <Seo
        title={`${site.name} · Maquillaje profesional en Guadalajara`}
        description="Maquillaje profesional para bodas, XV años, graduaciones, sesiones de fotos y eventos sociales en Guadalajara y su área metropolitana."
        image={site.heroImages.main}
        siteName={site.name}
      />
      <Navbar />
      <main>
        <Hero />
        <Services />
        <BeforeAfterSlider />
        <LookQuiz />
        <QuoteForm />
        <GroupCalculator />
        <Products />
        <Contact />
      </main>
      <Footer />
      <WelcomeTutorial />
    </>
  );
}

export default function HomePage() {
  return (
    <SiteDataProvider>
      <AppearanceApplier />
      <HomeContent />
    </SiteDataProvider>
  );
}
