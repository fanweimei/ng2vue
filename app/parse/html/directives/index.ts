import { HAttr, HEleNode } from "../typings";
import { autoComponentDirective } from "./cells/autocomplete";
import { defaultDirective } from "./cells/default";
import { dropdownDirective } from "./cells/dropdown";
import { gridDirective } from "./cells/grid";
import { popoverDirective } from "./cells/popover";
import { tooltipDirective } from "./cells/tooltip";
import { commonDirectiveEles, wrapperDirectiveEles } from "./const";

export const directiveProcess = {
  default: defaultDirective,
  "nz-col": gridDirective,
  "nz-row": gridDirective,
  "nz-tooltip": tooltipDirective,
  "nz-dropdown": dropdownDirective,
  "[nzAutocomplete]": autoComponentDirective,
  "nz-popover": popoverDirective,
};

// 属性（指令）需要转成标签元素的
export function directiveToElement(item: HEleNode) {
  for (let d of commonDirectiveEles) {
    let attr = item.attributes.find((e) => e.key == d);
    processDirectiveEle(attr, item);
  }
  // 包裹的指令元素执行一次
  let wrapperAttr = item.attributes.find((e) =>
    wrapperDirectiveEles.includes(e.key)
  );
  if (wrapperAttr) {
    processDirectiveEle(wrapperAttr, item);
  }
}

function processDirectiveEle(attr: HAttr, item: HEleNode) {
  if (!attr) {
    return;
  }
  if (directiveProcess[attr.key]) {
    directiveProcess[attr.key](item, attr);
  } else {
    directiveProcess.default(item, attr);
  }
}
