import { htmlContext } from "../../context";
import { HEleNode, HNodeType, TagType } from "../../typings";
import { transformFn } from "../../util";
import { cloneDeep } from "lodash";

export function sfAttrs(node: HEleNode) {
  let refName = "";
  let newAttrs = [
    {
      key: "layout",
      value: "inline",
    },
  ];
  for (let attr of node.attributes) {
    switch (true) {
      case attr.key.startsWith("#"):
        newAttrs.push({
          key: "ref",
          value: attr.key.slice(1),
        });
        refName = attr.key.slice(1);
        break;
      case attr.key == "[schema]":
        newAttrs.push({
          key: ":schemas",
          value: attr.value,
        });
        break;
    }
  }
  if (!refName) {
    refName = Math.random().toString(32).slice(2);
  }
  htmlContext.htmlParser.setTagNode(TagType.sf, refName, {
    node,
    origin: cloneDeep(node),
  });
  let children = [];
  for (let item of htmlContext.curParent.children) {
    if (item.type !== HNodeType.Element) {
      children.push(item);
      continue;
    }
    if (item.tagName !== "icc-button") {
      children.push(item);
      continue;
    }
    const classAttr = item.attributes.find((e) => e.key == "class");
    const clickAttr = item.attributes.find((e) => e.key == "(btnClick)");
    if (!classAttr || !clickAttr) {
      children.push(item);
      continue;
    }
    if (classAttr.value.includes("btn-search")) {
      newAttrs.push({
        key: "@submit",
        value: transformFn(clickAttr.value),
      });
    } else if (classAttr.value.includes("btn-cancel")) {
      newAttrs.push({
        key: "@reset",
        value: transformFn(clickAttr.value),
      });
    }
    if (!newAttrs.find((e) => e.key == ":action-col-options")) {
      newAttrs.push({
        key: ":action-col-options",
        value: "{ span: 5 }",
      });
    }
  }
  htmlContext.curParent.children = children;
  node.tagName = "icc-schema-form";
  node.attributes = newAttrs;
}
