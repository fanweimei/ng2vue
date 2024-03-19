import { SSrvResult } from "../typings";
import {
  CallExpression,
  Node,
  ObjectLiteralExpression,
  PropertyAccessExpression,
  PropertyAssignment,
  SyntaxKind,
} from "typescript";

export function processNzModalService(ssrName: string) {
  return (node: Node): SSrvResult => {
    if (
      node.kind !== SyntaxKind.PropertyAccessExpression ||
      (node as PropertyAccessExpression).expression.kind !==
        SyntaxKind.ThisKeyword
    ) {
      return;
    }
    if ((node as PropertyAccessExpression).name.getText() !== ssrName) {
      return;
    }
    if (
      (node as PropertyAccessExpression).parent.kind !==
      SyntaxKind.PropertyAccessExpression
    ) {
      return;
    }
    const propNode = (node as PropertyAccessExpression)
      .parent as PropertyAccessExpression;
    if (propNode.parent.kind !== SyntaxKind.CallExpression) {
      return;
    }
    const callNode = propNode.parent as CallExpression;
    const propName = propNode.name.getText();
    if (propName == "closeAll") {
      return {
        start: callNode.pos,
        end: callNode.end,
        content: `Modal.destroyAll()`,
        origin: callNode.getText(),
      };
    }
    if (
      !["confirm", "info", "success", "error", "warning", "create"].includes(
        propName
      )
    ) {
      return;
    }
    if (!callNode.arguments.length) {
      return;
    }
    if (callNode.arguments[0].kind !== SyntaxKind.ObjectLiteralExpression) {
      return {
        start: callNode.pos,
        end: callNode.end,
        content: `${callNode.getText().replace(ssrName, "Modal")}`,
        origin: callNode.getText(),
      };
    }
    let str = `{\n`;
    for (let item of (callNode.arguments[0] as ObjectLiteralExpression)
      .properties) {
      let key = item.name.getText();
      if (key == "nzCancelDisabled") {
        continue;
      }

      key = key.replace("nz", "").replace("On", "");
      key = key[0].toLowerCase() + key.slice(1);
      str += `\t${key}: ${(
        item as PropertyAssignment
      ).initializer.getText()},\n`;
    }
    str += "}";
    if (propName == "create") {
      this.importParser.add("useModal", "@icc/hooks");
      this.importParser.useCodeMap.set(
        ssrName,
        `const [ ${ssrName} ] = useModal();`
      );
      return {
        start: callNode.pos,
        end: callNode.end,
        content: `${ssrName}.show(${str})`,
        origin: callNode.getText(),
      };
    } else {
      this.importParser.add("Modal", "ant-design-vue");
    }
    return {
      start: callNode.pos,
      end: callNode.end,
      content: `Modal.${propName}(${str})`,
      origin: callNode.getText(),
    };
  };
}
