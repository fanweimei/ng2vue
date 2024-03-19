// 栅格布局的元素

import { HAttr, HEleNode } from "../../typings";
import { defaultDirective } from "./default";

export function gridDirective(item: HEleNode, attr: HAttr) {
  if (attr.key == "nz-row" && item.tagName == "nz-form-item") {
    // 无用就删除
    item.attributes = item.attributes.filter((e) => e.key != attr.key);
    return false;
  }
  // 如果是nz-form-label和nz-form-control上的栅格直接返回
  if (
    attr.key == "nz-col" &&
    (item.tagName == "nz-form-label" || item.tagName == "nz-form-control")
  ) {
    return false;
  }
  defaultDirective(item, attr);
}
