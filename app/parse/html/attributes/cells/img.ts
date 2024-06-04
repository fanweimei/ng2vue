import { HEleNode } from "../../typings";
import { defaultAttrs } from "./default";

export function imgAttrs(item: HEleNode) {
  defaultAttrs(item);
  const attr = item.attributes.find((e) => e.key == "src" || e.key == ":src");
  if (attr) {
    attr.value =
      attr.key == "src"
        ? attr.value.replace(/(\.\/)?assets/, "@icc/assets")
        : `require(${attr.value})`;
  }
  // 过滤掉alt为空的情况
  item.attributes = item.attributes.filter(e => !((e.key === ':alt' || e.key === 'alt') && !e.value));
}
