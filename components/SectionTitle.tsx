export default function SectionTitle({kicker, title, subtitle}:{kicker?:string,title:string,subtitle?:string}) {
  return (
    <div className="mb-10">
      {kicker && <div className="text-xs uppercase tracking-widest text-ash">{kicker}</div>}
      <h2 className="h2">{title}</h2>
      {subtitle && <p className="text-ash mt-2">{subtitle}</p>}
    </div>
  )
}
