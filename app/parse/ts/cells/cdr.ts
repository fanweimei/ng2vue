import { SSrvResult } from "../typings";
import { findNodeBFS } from "../util";
import { Node, SyntaxKind } from "typescript";

export function processCdr(ssrvName: string) {
  return (node: Node): SSrvResult => {
    let cdrNode = findNodeBFS(
      node,
      (item: Node) =>
        item.kind == SyntaxKind.PropertyAccessExpression &&
        item.getText().startsWith(`this.${ssrvName}`)
    );
    if (!cdrNode) {
      return;
    }
    let p = cdrNode.parent;
    while (p && p.kind != SyntaxKind.ExpressionStatement) {
      p = p.parent;
    }
    if (p) {
      return {
        start: p.pos,
        end: p.end,
        content: "",
        origin: p.getText(),
      };
    }
  };
}
