import * as fs from "fs";
import * as path from "path";

export function getValidVuePath(p: string) {
  const url = path.resolve(p);
  const tmp = url.split(path.sep);
  let filename = "index.vue";
  if (url.endsWith(".vue")) {
    filename = tmp.pop();
  }
  let dir = tmp.reduce((prev, cur) => {
    let d = prev ? `${prev}${path.sep}${cur}` : cur;
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d);
    }
    return d;
  }, "");
  return `${dir}${path.sep}${filename}`;
}

export function getValidNgPath(ngPath: string) {
  const url = path.resolve(ngPath);
  const temp = url.split(path.sep);
  let fileName = "",
    ngFrom = "";
  if (url.endsWith(".ts")) {
    fileName = temp[temp.length - 1];
    temp.pop();
    ngFrom = temp.join(path.sep);
  } else {
    fileName = `${temp[temp.length - 1]}.component.ts`;
    ngFrom = url;
  }
  return { fileName, ngFrom };
}
