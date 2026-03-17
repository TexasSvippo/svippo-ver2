import Hero from '@/components/Hero'
import Categories from '@/components/Categories'
import ServiceList from '@/components/ServiceList'
import CtaSection from '@/components/CtaSection'

export default function Home() {
  return (
    <main>
      <Hero />
      <Categories />
      <ServiceList />
      <CtaSection />
    </main>
  )
}