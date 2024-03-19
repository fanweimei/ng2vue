import { Node, PropertyAccessExpression, SyntaxKind } from "typescript";
import { SSrvResult } from "../typings";
import { findNodeBFS } from "../util";
import { allHttpMethods } from "../const";

export function replaceHttp(ssrName: string) {
  return (blockSource: string) => {
    blockSource = blockSource.replace(
      new RegExp(`this.${ssrName}.(.+).subscribe`, "g"),
      (_, s1) => {
        return `http.${s1}.then`;
      }
    );
    // this.importParser.add("http", "@icc/api");
    return blockSource;
  };
}

export function processHttp(ssrvName: string) {
  return (node: Node): SSrvResult => {
    if (node.kind !== SyntaxKind.PropertyAccessExpression) {
      return;
    }
    if ((node as PropertyAccessExpression).name.text !== "subscribe") {
      return;
    }
    if (!node.getText().startsWith(`this.${ssrvName}`)) {
      return;
    }
    const pipeNode = findNodeBFS(
      node,
      (n: Node) =>
        n.kind === SyntaxKind.PropertyAccessExpression &&
        (n as PropertyAccessExpression).name.text == "pipe"
    );
    // 用from 来转
    if (pipeNode) {
      const httpMethodNode = findNodeBFS(
        node,
        (n: Node) =>
          n.kind === SyntaxKind.PropertyAccessExpression &&
          allHttpMethods.includes((n as PropertyAccessExpression).name.text) &&
          n.parent.kind === SyntaxKind.CallExpression
      );
      if (httpMethodNode) {
        this.importParser.add("from", "rxjs");
        return {
          start: httpMethodNode.parent.pos,
          end: httpMethodNode.parent.end,
          content: `from(${httpMethodNode.parent.getText()})`,
          origin: httpMethodNode.parent.getText(),
        };
      }
      return;
    }
    // subscribe 替换为then
    const subscribeNode = findNodeBFS(
      node,
      (n: Node) =>
        n.kind === SyntaxKind.PropertyAccessExpression &&
        (n as PropertyAccessExpression).name.text == "subscribe"
    ) as PropertyAccessExpression;
    if (subscribeNode) {
      return {
        start: subscribeNode.pos,
        end: subscribeNode.end,
        content: `${subscribeNode.expression.getText()}.then`,
        origin: subscribeNode.getText(),
      };
    }
  };
}
