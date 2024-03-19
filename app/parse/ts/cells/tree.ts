import { FunctionDeclaration, Node, SyntaxKind } from "typescript";
import { createSourceTree, findNodeBFS } from "../util";
import { MethodItem } from "../typings";

/**
 * 处理a-tree上的方面
 * （1）@select
 * （2）@check
 *
 * 1. 加上第一个参数selectedKeys，
 * 2.  ${refName}.value?.getSelectedNodeList() --> selectedKeys
 * 3. 去掉.origin
 * 4. .parentNode --> .parent
 * 5. .nodes --> .checkedNodes
 */
export function replaceTreeMethod(
  mItem: MethodItem,
  refName: string,
  attrName: string
) {
  const root: Node = createSourceTree(mItem.content);
  const fnNode = findNodeBFS(
    root,
    (node: Node) => node.kind === SyntaxKind.FunctionDeclaration
  ) as FunctionDeclaration;
  if (!fnNode) {
    return;
  }
  let parameterStr = "selectedKeys";
  for (let p of fnNode.parameters) {
    parameterStr += `, ${p.getText()}`;
  }
  const blockNode = findNodeBFS(
    fnNode,
    (node: Node) => node.kind === SyntaxKind.Block
  );

  let blockSource = blockNode
    .getText()
    .replace(`${refName}.value?.getSelectedNodeList()`, "selectedKeys")
    .replace(/\.origin/g, "")
    .replace(/\.parentNode/g, ".parent");
  if (attrName === "check") {
    blockSource = blockSource.replace(/\.nodes/g, ".checkedNodes");
  }
  mItem.content = `${mItem.isAsync ? "async " : ""}function ${
    mItem.name
  }(${parameterStr}) ${blockSource}`;
}
