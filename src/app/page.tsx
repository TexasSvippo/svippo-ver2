import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('services').select('id').limit(1)

  return (
    <main>
      <h1>Svippo</h1>
      {error ? (
        <p style={{ color: 'red' }}>Fel: {error.message}</p>
      ) : (
        <p style={{ color: 'green' }}>✅ Supabase kopplat!</p>
      )}
    </main>
  )
}