import { HEleNode } from "../typings";
import { buttonAttrs, iccButtonAttrs } from "./cells/button";
import { defaultAttrs } from "./cells/default";
import { formAttrs } from "./cells/form";
import { nzFormItemAttrs } from "./cells/form-item";
import { iconAttrs } from "./cells/icon";
import { imgAttrs } from "./cells/img";
import { inputGroupAttrs } from "./cells/input-group";
import { seAttrs } from "./cells/se";
import { selectAttrs } from "./cells/select";
import { sfAttrs } from "./cells/sf";
import { stAttrs } from "./cells/st";
import { tableAttrs } from "./cells/table";

const attributesProcess = {
  form: formAttrs,
  se: seAttrs,
  "nz-form-item": nzFormItemAttrs,
  "nz-icon": iconAttrs,
  "nz-select": selectAttrs,
  default: defaultAttrs,
  st: stAttrs,
  "nz-input-group": inputGroupAttrs,
  sf: sfAttrs,
  img: imgAttrs,
  button: buttonAttrs,
  "icc-button": iccButtonAttrs,
  "nz-table": tableAttrs,
};

export function processElementAttrs(item: HEleNode) {
  if (item.tagName == "template" || item.tagName.startsWith("a-")) {
    // 前面步骤已经做了转换，是vue内部标签元素(或者vue元素），直接返回
    return;
  }
  if (attributesProcess[item.tagName]) {
    attributesProcess[item.tagName](item);
  } else {
    attributesProcess.default(item);
  }
}
