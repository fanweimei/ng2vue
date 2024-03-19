import {
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  SyntaxKind,
} from "typescript";
import { createSourceTree, findNodeBFS } from "../util";

export function parseSfSchema(uiContent: string, schemaContent: string) {
  const schemaMap = parseSfUi(uiContent);
  if (!schemaMap.size) {
    return "[]";
  }
  const root: Node = createSourceTree(`test(${schemaContent})`);
  const objNode = findNodeBFS(
    root,
    (node: Node) =>
      node.kind === SyntaxKind.PropertyAssignment &&
      (node as PropertyAssignment).name.getText() == "properties"
  ) as PropertyAssignment;
  if (!objNode) {
    return "[]";
  }
  const properties = (objNode.initializer as ObjectLiteralExpression)
    .properties;
  if (!properties.length) {
    return "[]";
  }
  for (let prop of properties) {
    let name = (prop as PropertyAssignment).name.getText();
    const schema = schemaMap.get(name);
    if (!schema) {
      continue;
    }
    const titleNode = (
      (prop as PropertyAssignment).initializer as ObjectLiteralExpression
    ).properties.find((e) => e.name.getText() == "title") as PropertyAssignment;
    if (!titleNode) {
      continue;
    }
    schema.label = titleNode.initializer.getText().replace(/"/g, "");
  }
  let str = "[\n";
  schemaMap.forEach((item) => {
    let line = "{\n";
    line += `\tfield: "${item.field}",\n`;
    line += `\tcomponent: "${item.component}",\n`;
    line += `\tlabel: "${item.label}",\n`;
    if (item.placeholder) {
      line += `\tcomponentProps: {\n\tplaceholder: "${item.placeholder}"\n},\n`;
    }
    line += `\tcolProps: {\nspan: 8\n},\n`;
    line += "},\n";
    str += line;
  });
  str += "];";
  return str;
}

export function parseSfUi(content: string) {
  let schemaMap = new Map();
  const root: Node = createSourceTree(`test(${content})`);
  const objNode = findNodeBFS(
    root,
    (node: Node) => node.kind === SyntaxKind.ObjectLiteralExpression
  ) as ObjectLiteralExpression;
  if (!objNode.properties.length) {
    return schemaMap;
  }
  for (let prop of objNode.properties) {
    let field = (prop as PropertyAssignment).name.getText().slice(1);
    const valNode = (prop as PropertyAssignment)
      .initializer as ObjectLiteralExpression;
    let component = "",
      placeholder = "";
    for (let attr of valNode.properties) {
      let t = (attr as PropertyAssignment).name.getText();
      let v = (attr as PropertyAssignment).initializer
        .getText()
        .replace(/"/g, "");
      switch (t) {
        case "widget":
          if (v == "string") {
            component = "Input";
          } else {
            component = v[0].toUpperCase() + v.slice(1);
          }
          break;
        case "placeholder":
          placeholder = v;
          break;
      }
      if (component) {
        schemaMap.set(field, {
          field,
          component,
          placeholder,
        });
      }
    }
  }
  return schemaMap;
}
