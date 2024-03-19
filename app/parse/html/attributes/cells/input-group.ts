import { HEleNode, HNodeType } from "@ngParse/html/typings";
import { defaultAttrs } from "./default";

export function inputGroupAttrs(item: HEleNode) {
  let inputDom = item.children.find(
    (e) =>
      e.type === HNodeType.Element &&
      e.tagName == "input" &&
      e.attributes.find((e) => e.key == "nz-input")
  ) as HEleNode;
  if (inputDom) {
    let attrs = item.attributes.filter(
      (e) =>
        !["*ngIf", "*ngFor", "class", "style", "nzSize", "nzCompact"].find(
          (s) => e.key.includes(s)
        )
    );
    inputDom.attributes = [...inputDom.attributes, ...attrs];
    item.attributes = item.attributes.filter((e) =>
      ["*ngIf", "*ngFor", "class", "style", "nzSize", "nzCompact"].find((s) =>
        e.key.includes(s)
      )
    );
  }
  defaultAttrs(item);
}
