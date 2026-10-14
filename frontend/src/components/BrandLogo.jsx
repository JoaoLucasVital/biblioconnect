/** Geometric BC / collection connections. Proposal 03, applied provisionally. */
export default function BrandLogo({className=""}) {
  return <svg className={`text-brand dark:text-[#fff7ed] ${className}`} width="42" height="42" viewBox="0 0 112 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="BiblioConnect" role="img">
    <path fill="currentColor" fillRule="evenodd" d="M8 8h22c15 0 23 7 23 18 0 8-4 13-11 16 9 3 14 9 14 18 0 13-10 20-26 20H8V8Zm12 11v18h10c7 0 11-3 11-9s-4-9-11-9H20Zm0 30v20h11c8 0 13-3 13-10s-4-10-13-10H20Z"/>
    <path d="M102 17C84 17 68 31 68 48s16 31 34 31" stroke="#e67e00" strokeWidth="10"/>
    <path d="m102 17-34 31 34 31" stroke="currentColor" strokeWidth="3"/>
    {[{x:102,y:17},{x:68,y:48},{x:102,y:79}].map(p=><circle key={p.y} cx={p.x} cy={p.y} r="5.5" fill="#e67e00" stroke="var(--bg,#fff7ed)" strokeWidth="1.5"/>)}
  </svg>;
}
