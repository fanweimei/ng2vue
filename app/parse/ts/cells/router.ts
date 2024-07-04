import {
  ArrayLiteralExpression,
  CallExpression,
  Identifier,
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  SyntaxKind,
} from "typescript";

export function processRouter(ssrName: string) {
  return (node: Node) => {
    if (node.kind !== SyntaxKind.CallExpression) {
      return;
    }
    if (
      (node as CallExpression).expression.kind !==
      SyntaxKind.PropertyAccessExpression
    ) {
      return;
    }
    if (
      (node as CallExpression).expression.getText() !=
      `this.${ssrName}.navigate`
    ) {
      return;
    }
    const args = (node as CallExpression).arguments;
    if (!args.length) {
      return;
    }
    let path = (args[0] as ArrayLiteralExpression).elements[0].getText();
    let queryStr = "";
    if (args.length > 1 && args[1].kind == SyntaxKind.ObjectLiteralExpression) {
      const queryNode = (args[1] as ObjectLiteralExpression).properties.find(
        (e) =>
          ((e as PropertyAssignment).name as Identifier).text == "queryParams"
      );
      if (queryNode) {
        queryStr = (queryNode as PropertyAssignment).initializer?.getText();
      }
    }
    let str = "";
    if (!queryStr) {
      str = `this.${ssrName}.push(${path})`;
    } else {
      str = `this.${ssrName}.push({
        path: ${path},
        query: ${queryStr}
      })`;
    }
    return {
      start: node.pos,
      end: node.end,
      content: str,
      origin: node.getText(),
    };
  };
}

export function replaceRouter(ssrName: string) {
  return (blockSource: string): string => {
    blockSource = blockSource.replace(
      new RegExp(`this.${ssrName}.navigateByUrl`, "g"),
      `${ssrName}.push`
    );
    return blockSource;
  };
}
