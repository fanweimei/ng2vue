import {
  ScriptKind,
  ScriptTarget,
  SourceFile,
  createSourceFile,
  Node,
} from "typescript";
import { fnChangeArray } from "./const";

export const EMAIL_REGEXP =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// 输入一段ts文本字符串，输出一颗树形结构
export function createSourceTree(content: string) {
  const source: SourceFile = createSourceFile(
    "inline.tsx",
    content,
    ScriptTarget.ES2015,
    true,
    ScriptKind.TS
  );
  const root = source.getChildAt(0);
  return root;
}

// 深度遍历查找满足条件的节点
export function findNodeDFS(
  root: Node,
  getNode: (node: Node) => boolean
): Node | null {
  if (getNode(root)) {
    return root;
  }
  if (root.getChildCount() <= 0) {
    return null;
  }
  const children = root.getChildren();
  for (let item of children) {
    let child = findNodeDFS(item, getNode);
    if (child) {
      return child;
    }
  }
}

// 广度遍历查找满足条件的节点
export function findNodeBFS(
  root: Node,
  getNode: (node: Node) => boolean
): Node | null {
  if (getNode(root)) {
    return root;
  }
  const stack = [root];
  while (stack.length) {
    let node = stack.shift();
    if (getNode(node)) {
      return node;
    }
    if (node.getChildCount() > 0) {
      stack.push(...node.getChildren());
    }
  }
  return null;
}

export function isChangeValue(source: string, name: string) {
  if (source.includes(`this.${name} =`)) {
    return true;
  }
  if (source.includes(`this.${name}=`)) {
    return true;
  }
  if (fnChangeArray.some((e) => source.includes(`this.${name}.${e}`))) {
    return true;
  }
  return false;
}
