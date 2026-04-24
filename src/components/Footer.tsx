import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[var(--color-dark)] text-[rgba(255,255,255,0.75)] pt-16">

      <div className="container grid grid-cols-1 md:grid-cols-[1.5fr_3fr] gap-16 pb-16">

        {/* Logga & slogan */}
        <div className="flex flex-col gap-3">
          <Image src="/logo.svg" alt="Svippo" width={100} height={32} />
          <p className="text-[14px] text-[rgba(255,255,255,0.5)] leading-[1.5]">Där drömmar går i uppfyllelse</p>
        </div>

        {/* Kolumner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">

          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-bold text-white mb-1 font-[var(--font-body)]">Svippo</h4>
            <Link href="/om-oss" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Om oss</Link>
            <Link href="/var-historia" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Vår historia</Link>
            <Link href="/blogg" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Blogg</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-bold text-white mb-1 font-[var(--font-body)]">Tjänster</h4>
            <Link href="/services/digitala" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Digitala tjänster</Link>
            <Link href="/services/medie-design" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Medie och design</Link>
            <Link href="/services/utbildning" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Utbildning</Link>
            <Link href="/services/hushall" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Hushållstjänster</Link>
            <Link href="/services/bil" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Biltjänster</Link>
            <Link href="/services/skonhet" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Skönhet och hälsa</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-bold text-white mb-1 font-[var(--font-body)]">Svippo hjälp</h4>
            <Link href="/hjalp/svippare" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Vara svippare</Link>
            <Link href="/hjalp/bestallare" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Vara beställare</Link>
            <Link href="/hjalp/foretag" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">Vara företag</Link>
            <Link href="/faq" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">FAQ</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-bold text-white mb-1 font-[var(--font-body)]">Kontakt</h4>
            <a href="mailto:kontakt@svippo.se" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">kontakt@svippo.se</a>
            <a href="tel:020105707" className="text-[14px] text-[rgba(255,255,255,0.6)] leading-[1.4] hover:text-white transition-colors duration-200">020-105 707</a>
          </div>

        </div>
      </div>

      {/* Botten */}
      <div className="border-t border-[rgba(255,255,255,0.1)] py-5">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 text-center md:text-left">
          <span className="text-[13px] text-[rgba(255,255,255,0.4)]">© {new Date().getFullYear()} Svippo. Alla rättigheter förbehållna.</span>
          <div className="flex gap-6">
            <Link href="/integritetspolicy" className="text-[13px] text-[rgba(255,255,255,0.4)] hover:text-white transition-colors duration-200">Integritetspolicy</Link>
            <Link href="/villkor" className="text-[13px] text-[rgba(255,255,255,0.4)] hover:text-white transition-colors duration-200">Användarvillkor</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
