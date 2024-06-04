import { htmlContext } from "../../context";
import { HAttr, HEleNode, HNodeType, TagType } from "../../typings";
import { cloneDeep } from "lodash";
import { strToObj } from "../../util";
import { commonAttrs } from "./default";
import { isRemoveAttr } from "../const";

// st --> icc-dynamic-table (st简单处理)
export function stAttrs(item: HEleNode) {
  item.tagName = "icc-dynamic-table";
  let newAttrs: HAttr[] = [];
  const _cloneNode = cloneDeep(item);
  let refName = "";
  for (let attr of item.attributes) {
    switch (true) {
      case attr.key.includes("#"):
        newAttrs.push({ key: "ref", value: attr.key.slice(1) });
        refName = attr.key.slice(1);
        break;
      case attr.key == "[widthMode]":
      case attr.key == "[noResult]":
      case attr.key == "ps":
      case attr.key == "pi":
      case attr.key == "[ps]":
      case attr.key == "[pi]":
        break;
      case attr.key == "[page]":
        let page = strToObj(attr.value);
        if (page.key == 'obj' && page.value.show == false) {
          newAttrs.push({ key: ":pagination", value: "false" });
        }
        break;
      default:
        if (!isRemoveAttr(item, attr)) {
          commonAttrs(attr, newAttrs);
        }
    }
  }
  // 处理子级
  item.children = processStChildren(item);
  if (!refName) {
    // st在ts文件中没有对应的引用
    refName = `st${Math.random().toString(32).slice(2)}`;
  }
  htmlContext.htmlParser.setTagNode(TagType.st, refName, {
    node: item,
    origin: _cloneNode,
  });
  item.attributes = newAttrs;
}

function processStChildren(item: HEleNode) {
  let children = item.children.filter(
    (e) =>
      e.type == HNodeType.Element &&
      e.tagName == "ng-template" &&
      e.attributes.find((e) => e.key == "st-row")
  ) as HEleNode[];
  for (let child of children) {
    child.tagName = "template";
    let tmplName = child.attributes.find((e) => e.key == "st-row");
    if (child.attributes.find((e) => e.key == "type" && e.value == "title")) {
      child.attributes = [{ key: `#${tmplName.value}`, value: undefined }];
    } else {
      child.attributes = [{ key: `#${tmplName.value}`, value: "item" }];
    }
  }
  return item.children;
}
