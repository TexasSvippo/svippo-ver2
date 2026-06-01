// Sanity Studio uses its own full-page layout — exclude global navbar/footer
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
