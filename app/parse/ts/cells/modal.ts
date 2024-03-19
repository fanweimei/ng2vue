import { SSrvResult } from "../typings";
import {
  CallExpression,
  Node,
  PropertyAccessExpression,
  PropertyAssignment,
  SyntaxKind,
  isArrowFunction,
  isObjectLiteralExpression,
} from "typescript";
import { findNodeBFS } from "../util";

// subscribe订阅里的方法放到onOk
export function processModalHelper(ssrName: string) {
  return (node: Node): SSrvResult => {
    if (node.kind !== SyntaxKind.CallExpression) {
      return;
    }
    if (!node.getText().startsWith(`this.${ssrName}`)) {
      return;
    }
    if (!(node as CallExpression).arguments.length) {
      return;
    }
    if (!isArrowFunction((node as CallExpression).arguments[0])) {
      return;
    }
    const subscribeStr = (node as CallExpression).arguments[0].getText();
    const createStaticNode = findNodeBFS(
      node,
      (n: Node) =>
        n.kind == SyntaxKind.CallExpression &&
        ["createStatic", "create"].includes(
          ((n as CallExpression).expression as PropertyAccessExpression).name
            .text
        )
    ) as CallExpression;
    const componentStr = createStaticNode.arguments[0].getText();
    let paramsStr = "{}";
    if (createStaticNode.arguments.length > 1) {
      paramsStr = createStaticNode.arguments[1].getText();
    }
    let optionStr = "";
    if (createStaticNode.arguments.length > 2) {
      // 说明是{}这种形式
      if (isObjectLiteralExpression(createStaticNode.arguments[2])) {
        for (let item of createStaticNode.arguments[2].properties) {
          if (
            item.name.getText() == "size" &&
            (item as PropertyAssignment).initializer
          ) {
            let size = (item as PropertyAssignment).initializer
              .getText()
              .replace(/"/g, "")
              .trim();
            switch (size) {
              case "sm":
                optionStr += `size: 400,\n`;
                break;
              case "md":
                optionStr += `size: 600,\n`;
                break;
              case "lg":
                optionStr += `size: 800,\n`;
                break;
              case "xl":
                optionStr += `size: 1000,\n`;
                break;
              default:
                optionStr += `${item.getText()},\n`;
            }
          } else {
            optionStr += `${item.getText()},\n`;
          }
        }
      } else {
        // 说明是变量
        optionStr = `...${createStaticNode.arguments[2].getText()},\n`;
      }
    }
    optionStr += `\t\tonOk: ${subscribeStr}`;
    const modalStr = `this.${ssrName}.createStatic(${componentStr}, ${paramsStr}, {
      ${optionStr}
    })`;
    // 处理解析modal弹窗组件
    this.parseModalComponent(componentStr, paramsStr);

    return {
      start: node.pos,
      end: node.end,
      content: modalStr,
      origin: node.getText(),
    };
  };
}

export function replaceModalRef(ssrName: string) {
  return (blockSource: string): string => {
    let str = blockSource.replace(
      new RegExp(`this.${ssrName}.close\\((.*)\\)`, "g"),
      (_, s1) => {
        if (s1) {
          return `emits('close', ${s1})`;
        }
        return `emits('close')`;
      }
    );
    str = str.replace(
      new RegExp(`this.${ssrName}.destroy\\((.*)\\)`, "g"),
      (_, s1) => {
        if (s1) {
          return `emits('close', ${s1})`;
        }
        return `emits('close')`;
      }
    );
    return str;
  };
}
