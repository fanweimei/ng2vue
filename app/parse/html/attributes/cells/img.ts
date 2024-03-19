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
}
