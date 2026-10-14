import {it,expect} from "vitest";
import {suggestPortraitCrop} from "./portrait-math.js";
it("recorte exige rosto identificável e sugere enquadramento com margem para cabelo",()=>{
  expect(()=>suggestPortraitCrop(new Float32Array(100),10,10)).toThrow(/rosto/);
  const face=new Float32Array(10000);for(let y=30;y<60;y++)for(let x=35;x<65;x++)face[y*100+x]=.9;
  const crop=suggestPortraitCrop(face,100,100);expect(crop.width/crop.height).toBeCloseTo(.8);expect(crop.x).toBeLessThan(.35);expect(crop.y).toBeLessThan(.3);expect(crop.y+crop.height).toBeGreaterThan(.6);
});
