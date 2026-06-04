export default function GoogleMap({ address='Council Bluffs, IA', title='Yard Loop Service Area' }){
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if(!key) return null
  const query = encodeURIComponent(address)
  const src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${query}`
  return (
    <section className="section">
      <div className="card">
        <h2>{title}</h2>
        <p className="muted">Serving Council Bluffs, Omaha, Carter Lake, and nearby metro neighborhoods.</p>
        <iframe
          title={title}
          src={src}
          width="100%"
          height="320"
          style={{ border:0, borderRadius:'18px' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  )
}
