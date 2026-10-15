import './text-animations.css';
// React Bits Shiny Text and Blur Text effects, adapted to the existing CSS motion tokens.
export function ShinyText({children,className=''}){return <span className={`bc-shiny-text ${className}`}>{children}</span>;}
export function AnimatedHeading({as:Tag='h1',children,className='',...props}){return <Tag {...props} className={`bc-animated-heading ${className}`}>{children}</Tag>;}
