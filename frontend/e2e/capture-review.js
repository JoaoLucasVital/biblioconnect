import fs from "node:fs/promises";
import path from "node:path";
export async function captureReview(page,name,{fullPage=false}={}) {
  const directory=path.resolve("../.impeccable/review");
  await fs.mkdir(directory,{recursive:true});
  await page.evaluate(()=>document.fonts.ready);
  return page.screenshot({path:path.join(directory,name+".png"),fullPage});
}
