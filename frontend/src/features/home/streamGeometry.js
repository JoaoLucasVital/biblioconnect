// Corridor geometry adapted from Ruixen UI's MIT Image Stream Hero.
// Source: https://ruixen.com/r/image-stream-hero
export function streamKeyframes(direction,name) {
  const steps=[];
  for(let step=0;step<=24;step++){
    const u=step/24,scale=(2.6/25)*Math.pow(46/2.6,u);
    const z=30*(1-1/scale),rail=44-55*Math.pow(1-u,3.3),turn=6+22*u;
    steps.push(`${(u*100).toFixed(2)}%{transform:translate3d(${(direction*rail).toFixed(2)}cqw,0,${z.toFixed(2)}cqw) rotateY(${(-direction*turn).toFixed(2)}deg)}`);
  }
  return `@keyframes ${name}{${steps.join("")}}`;
}
