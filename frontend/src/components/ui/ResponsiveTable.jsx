export default function ResponsiveTable({caption,children}) {
  return <div role="region" aria-label={caption} tabIndex={0} className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain border-y border-stroke">
    <table className="w-full min-w-[720px] border-collapse text-left text-sm [&_th]:border-b [&_th]:border-stroke [&_th]:py-4 [&_th]:pr-6 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted [&_td]:border-b [&_td]:border-stroke [&_td]:py-5 [&_td]:pr-6 [&_td]:align-top">
      <caption className="sr-only">{caption}</caption>{children}
    </table>
  </div>;
}
