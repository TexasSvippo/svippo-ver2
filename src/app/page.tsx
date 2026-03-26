import Hero from '@/components/Hero'
import Categories from '@/components/Categories'
import ServiceList from '@/components/ServiceList'
import HowItWorks from '@/components/HowItWorks'
import FeatureSlider from '@/components/FeatureSlider'
import CtaSection from '@/components/CtaSection'

export default function Home() {
  return (
    <main>
      <Hero />
      <Categories />
      <ServiceList />
      <HowItWorks />
      <FeatureSlider />
      <CtaSection />
    </main>
  )
}