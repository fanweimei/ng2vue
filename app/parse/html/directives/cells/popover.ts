import { commonAttrs } from "@ngParse/html/attributes/cells/default";
import { htmlContext } from "../../context";
import { HAttr, HEleNode, HNode, HNodeType } from "../../typings";
import { defaultDirective } from "./default";
import { findNodeBFS } from "@ngParse/html/util";
import { cloneDeep } from "lodash";

export function popoverDirective(item: HEleNode, attr: HAttr) {
  const newNode = defaultDirective(item, attr, true);

  let newAttrs: HAttr[] = [];
  for (let attr of newNode.attributes) {
    attr.key = attr.key.replace("Popover", "");
    if (attr.key == "[(nzVisible)]") {
      newAttrs.push({ key: "v-model:visible", value: attr.value });
    } else {
      commonAttrs(attr, newAttrs);
    }
  }
  newNode.attributes = newAttrs;
  replaceTemplateAttr("title", newAttrs, newNode);
  replaceTemplateAttr("content", newAttrs, newNode);
}

function replaceTemplateAttr(
  attrName: string,
  newAttrs: HAttr[],
  newNode: HEleNode
) {
  let titleAttr = newAttrs.find((e) => e.key == `:${attrName}`);
  if (!titleAttr) {
    return;
  }
  const titleTemp = findNodeBFS(
    htmlContext.json,
    (node: HNode) =>
      node.type === HNodeType.Element &&
      node.tagName == "ng-template" &&
      !!node.attributes.find((e) => e.key == `#${titleAttr.value}`)
  ) as HEleNode;
  if (titleTemp) {
    const newTitleTemp = cloneDeep(titleTemp);
    newTitleTemp.attributes = [{ key: `#${attrName}`, value: "" }];
    newTitleTemp.tagName = "template";
    newNode.children = newNode.children || [
      { type: HNodeType.Text, content: "\n" },
    ];
    newNode.children.push(newTitleTemp);
    newNode.children.push({ type: HNodeType.Text, content: "\n" });
    newNode.attributes = newAttrs.filter((e) => e.key !== `:${attrName}`);
  }
}
