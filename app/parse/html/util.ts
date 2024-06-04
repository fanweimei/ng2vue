import { htmlContext } from "./context";
import { HAttr, HEleNode, HNode, HNodeType } from "./typings";
import { cloneDeep } from "lodash";
import * as strings from "../../share/strings";
import { createSourceTree } from "@ngParse/ts/util";
import { CallExpression, Node, ObjectLiteralExpression, SyntaxKind, isPropertyAssignment, isShorthandPropertyAssignment } from "typescript";
import { findNodeBFS as tsFindNodeBFS } from "@ngParse/ts/util";

// 是否是自定义组件的标签
export function isCusComponent(tagName: string) {
  return (
    tagName.startsWith("nz") || tagName.startsWith("icc") || tagName == "form"
  );
}

// 广度遍历查找节点
export function findNodeBFS(
  nodes: HNode[],
  getNode: (node: HNode) => boolean
): HNode | null {
  let stack = [...nodes];
  while (stack.length) {
    let node = stack.shift() as HNode;
    if (getNode(node)) {
      return node;
    }
    if (node.type == HNodeType.Element && node.children?.length) {
      stack.push(...node.children);
    }
  }
  return null;
}

// 深度优先遍历查找节点
export function findNodeDFS(
  root: HNode,
  getNode: (node: HNode) => boolean
): HNode | null {
  if (getNode(root)) {
    return root;
  }
  if (root.type === HNodeType.Element && root.children?.length) {
    for (let item of root.children) {
      let selected = findNodeDFS(item, getNode);
      if (selected) {
        return selected;
      }
    }
  }
}

//是否是文本节点
export function isTextNode(node: HNode) {
  return node.type == HNodeType.Text || node.type == HNodeType.Comment;
}

// 是否是元素节点
export function isElementNode(node: HNode) {
  return node.type == HNodeType.Element;
}

// 去掉空格
export function removeSpaces(str: string = "") {
  return str.replace(/(\n)*(\r)*(\t)*(\v)*/g, "").trim();
}

// 是否是空字符串
export function isEmptyStr(str: string = "") {
  return !str.replace(/(\n)*(\r)*(\t)*(\v)*/g, "").trim();
}
//是否两个节点都是换行符
export function isSameEmptyNode(node1: HNode, node2: HNode) {
  return (
    node1.type == HNodeType.Text &&
    node2.type == HNodeType.Text &&
    isEmptyStr(node1.content) &&
    isEmptyStr(node2.content)
  );
}
// 将字符串转成json对象
export function strToObj(val: string) {
  if(!val.trim()?.length) {
    return { key: 'null', value: null };
  }
  const root: Node = createSourceTree(`test(${val})`);
  const callNode = tsFindNodeBFS(root, (node: Node) => node.kind === SyntaxKind.CallExpression) as CallExpression
  switch(callNode.arguments[0].kind) {
    case SyntaxKind.StringLiteral:
      // 说明是字符串
      return { key: 'string', value: val };
    case SyntaxKind.Identifier:
      // 说明是变量
      return { key: 'identifier', value: val };
    case SyntaxKind.ObjectLiteralExpression:
      let obj: any = {};
      for(let property of (callNode.arguments[0] as ObjectLiteralExpression).properties) {
        if(isPropertyAssignment(property)) {
          obj[property.name.getText()] = getStr(property.initializer.getText());
        } else if(isShorthandPropertyAssignment(property)) {
          obj[property.getText()] = property.getText()
        }
      }
      return { key: 'obj', value: obj };
    default: 
      return { key: 'null', value: null };
  }
}

// 获取最近的form标签父节点
export function getParentFormNode(
  stack: HEleNode[],
  level: number
): null | HEleNode {
  if (!stack.length) {
    return null;
  }
  while (stack.length && stack[stack.length - 1].level >= level) {
    stack.pop();
  }
  return stack.length ? stack[stack.length - 1] : null;
}

/**
 * 方法替换
 * fn($event) -> fn
 * fn($event, rest) -> (e) => fn(e, rest)
 */
export function transformFn(value: string = ""): string {
  let fnStr = value.replace(/\((.*)\)/, "");
  value.replace(/.+\((.+)\)/, (s0, s1) => {
    let params = s1.split(",");
    if (params.length > 1 || params[0]?.trim() != "$event") {
      let paramStr = "";
      for (let p of params) {
        p = p.trim();
        if (!p) {
          continue;
        }
        if (p == "$event") {
          paramStr += ", e";
        } else {
          paramStr += `,${p}`;
        }
      }
      fnStr = `(e) => ${fnStr}(${paramStr.slice(1).trim()})`;
    }
    return s0;
  });
  return fnStr;
}

// 转换属性
export function transformProperty(value: string = "") {
  if (!value || !value.startsWith("$any")) {
    return value;
  }
  let val = value.replace(/^\$any/, "");
  val = val.slice(1, val.length - 1);
  return val;
}

// 查找ng-template模板
export function updateTemplateNodePos(
  item: HEleNode,
  attr: HAttr,
  value: null | string = null
) {
  const templNode = findNodeBFS(
    htmlContext.json,
    (node: HNode) =>
      node.type === HNodeType.Element &&
      node.tagName == "ng-template" &&
      !!node.attributes.find((e) => e.key == `#${attr.value}`)
  ) as HEleNode;
  if (templNode) {
    const newTemplNode = cloneDeep(templNode);
    newTemplNode.attributes = [
      { key: `#${strings.camelize(attr.key.slice(1))}`, value },
    ];
    newTemplNode.tagName = "template";
    item.children = item.children || [];
    item.children.push({ type: HNodeType.Text, content: "\n" });
    item.children.push(newTemplNode);
    item.children.push({ type: HNodeType.Text, content: "\n" });
    item.attributes = item.attributes.filter((e) => e.key !== `${attr.key}`);
    if (templNode._p) {
      templNode._p.children = templNode._p.children.filter(
        (n) => n != templNode
      );
    }
    return true;
  }
  return false;
}

// 是否可能是一个ng-template的名字
export function isTemplateName(str: string) {
  if (!str.trim()) {
    return false;
  }
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/gi.test(str)) {
    return !htmlContext.htmlParser.parent.tsParser.properties.find(
      (e) => e.name == str
    );
  }
  return false;
}

export function getNum(str: string, defaultValue = 0) {
  if(!str) {
    return defaultValue;
  }
  return Number(str.replace(`'`, "").replace(`'`, "").replace(`"`, "").replace(`"`, "")) || defaultValue;
}
// 去掉字符串前后的引号
export function getStr(str: string) {
  return str.replace(`'`, "").replace(`'`, "").replace(`"`, "").replace(`"`, "");
}