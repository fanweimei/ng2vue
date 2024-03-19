import { HAttr, HEleNode } from "../../typings";
import { commonAttrs } from "./default";

/**
 * 处理antd 自带的icon图标
 * zorro: <span nz-icon nzType="question" nzTheme="outline"></span>
 * antv: <question-outlined />
 */
export function iconAttrs(item: HEleNode) {
  let theme = "outlined",
    type = "",
    typeVar: string = "";
  let newAttrs: HAttr[] = [];
  for (let attr of item.attributes) {
    switch (attr.key) {
      case "nzType":
        type = attr.value;
        break;
      case "nzTheme":
        if (attr.value == "twotone") {
          theme = "two-tone";
        } else if (attr.value == "fill") {
          theme = "filled";
        } else {
          theme = "outlined";
        }
        break;
      case "nz-icon":
        break;
      case "[nzType]":
        typeVar = attr.value;
        break;
      default:
        commonAttrs(attr, newAttrs);
        break;
    }
  }
  if (type) {
    item.tagName = `${type}-${theme}`;
    item.attributes = newAttrs;
    return;
  }
  /**假设是一个三目运算，再复杂的情况不考虑
   * [nzType]="expandForm ? 'caret-up' : 'caret-down'"
   */
  if (typeVar.trim() == `expandForm ? 'caret-up' : 'caret-down'`) {
    item.tagName = "icc-arrow";
    item.attributes = [
      ...newAttrs,
      {
        key: ":expand",
        value: "expandForm",
      },
    ];
  } else {
    type = typeVar.replace(`'`, "").replace(`'`, "");
    item.tagName = `${type}-${theme}`;
    item.attributes = newAttrs;
  }
}
