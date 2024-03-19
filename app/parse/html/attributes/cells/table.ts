/**
 * 处理nz-table的场景
 */

import { HAttr, HEleNode, HNode, HNodeType } from "@ngParse/html/typings";
import { commonAttrs } from "./default";
import { isRemoveAttr } from "../const";

function getPaginationAttr(item: HEleNode) {
  let paginationAttrs: HAttr[] = [];
  let others: HAttr[] = [];
  for (let attr of item.attributes) {
    if (
      [
        "nzFrontPagination",
        "nzTotal",
        "nzPageIndex",
        "nzPageSize",
        "nzShowPagination",
        "nzShowTotal",
      ].find((e) => attr.key.includes(e))
    ) {
      paginationAttrs.push(attr);
    } else {
      others.push(attr);
    }
  }
  item.attributes = others;
  const attr = item.attributes.find(
    (e) => e.key == "nzShowPagination" || e.key == "[nzShowPagination]"
  );
  if (attr && attr.value == "false") {
    return { key: ":pagination", value: "false" };
  }
  let newAttrs: HAttr[] = [];
  for (let attr of paginationAttrs) {
    switch (attr.key) {
      case "nzPageIndex":
      case "[nzPageIndex]":
      case "([nzPageIndex])":
        newAttrs.push({
          key: "current",
          value: attr.value,
        });
        break;
      case "nzPageSize":
      case "[nzPageSize]":
      case "([nzPageSize])":
        newAttrs.push({
          key: "pageSize",
          value: attr.value,
        });
        break;
      default:
        commonAttrs(attr, newAttrs);
        break;
    }
  }
  if (!newAttrs.length) {
    return;
  }
  let str = "";
  for (let attr of newAttrs) {
    str += `${attr.key}: ${attr.value}, `;
  }
  str = str.trim();
  str = str.slice(0, str.length - 1);
  return { key: ":pagination", value: `{${str}}` };
}

export function tableAttrs(item: HEleNode) {
  let newAttrs: HAttr[] = [];
  // 处理分页参数
  const pagination = getPaginationAttr(item);
  if (pagination) {
    newAttrs.push(pagination);
  }
  //其它参数
  for (let attr of item.attributes) {
    switch (attr.key) {
      case "[nzData]":
        newAttrs.push({
          key: ":data-source",
          value: attr.value,
        });
        break;
      default:
        if (!isRemoveAttr(item, attr)) {
          commonAttrs(attr, newAttrs);
        }
        break;
    }
  }
  item.attributes = newAttrs;

  // 子级
  const thead = item.children.find(
    (e) => e.type === HNodeType.Element && e.tagName === "thead"
  ) as HEleNode;
  const tbody = item.children.find(
    (e) => e.type === HNodeType.Element && e.tagName === "tbody"
  ) as HEleNode;
  if (!tbody) {
    return;
  }
  let th: HEleNode[] = [];
  if (thead) {
    let tmpNode = thead.children.find(
      (e) => e.type === HNodeType.Element && e.tagName === "tr"
    ) as HEleNode;
    th = (tmpNode?.children.filter(
      (e) => e.type === HNodeType.Element && e.tagName === "th"
    ) || []) as HEleNode[];
  }
  const tr = tbody.children.find(
    (e) => e.type === HNodeType.Element && e.tagName === "tr"
  ) as HEleNode;
  const td = tr.children.filter(
    (e) => e.type === HNodeType.Element && e.tagName === "td"
  ) as HEleNode[];
  if (th.length && th.length != td.length) {
    return;
  }

  let children: HNode[] = [{ type: HNodeType.Text, content: "\n" }];
  for (let i = 0; i < td.length; i++) {
    let node: HEleNode = {
      type: HNodeType.Element,
      tagName: "a-table-column",
      attributes: [{ key: "data-index", value: "" }],
      children: [{ type: HNodeType.Text, content: "\n" }],
    };
    if (th.length) {
      node.children.push({
        type: HNodeType.Element,
        tagName: "template",
        attributes: [{ key: "#title", value: null }],
        children: th[i].children,
      });
      node.children.push({ type: HNodeType.Text, content: "\n" });
      let widthAttr = th[i].attributes.find(
        (e) => e.key == "nzWidth" || "[nzWidth]"
      );
      if (widthAttr) {
        node.attributes.push({
          key: widthAttr.key == "nzWidth" ? "width" : ":width",
          value: widthAttr.value,
        });
      }
    }
    node.children.push({
      type: HNodeType.Element,
      tagName: "template",
      attributes: [{ key: "#default", value: "{record}" }],
      children: td[i].children,
    });
    node.children.push({ type: HNodeType.Text, content: "\n" });
    children.push(node);
    children.push({ type: HNodeType.Text, content: "\n" });
  }
  item.children = children;
}
