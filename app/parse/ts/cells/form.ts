import {
  SyntaxKind,
  Node,
  NodeArray,
  isArrayLiteralExpression,
  ObjectLiteralExpression,
  PropertyAssignment,
  Identifier,
  isNewExpression,
  isCallExpression,
  LiteralExpression,
  BinaryExpression,
  PropertyAccessExpression,
  CallExpression,
} from "typescript";
import { EMAIL_REGEXP, createSourceTree, findNodeBFS } from "../util";
import { htmlContext } from "@ngParse/html/context";
import { TagType } from "@ngParse/html/typings";
import { SSrvResult } from "../typings";

// 解析响应式表单，获取内容和研究规则
export function parseReactiveFormSource(content: string) {
  const root: Node = createSourceTree(content);
  const objNode = findNodeBFS(
    root,
    (node: Node) => node.kind == SyntaxKind.ObjectLiteralExpression
  );
  if (!objNode) {
    return;
  }
  let formValue: any = {};
  let ruleMap = new Map();
  const processValidator = (rules: any[], node: Node) => {
    let text = node.getText();
    switch (true) {
      case text.startsWith("Validators.required"):
        rules.push({
          required: true,
        });
        break;
      case text.startsWith("Validators.min("):
        rules.push({
          min: text.replace("Validators.min(", "").replace(")", "").trim(),
        });
        break;
      case text.startsWith("Validators.max("):
        rules.push({
          max: text.replace("Validators.max(", "").replace(")", "").trim(),
        });
        break;
      case text.startsWith("Validators.email"):
        rules.push({
          pattern: EMAIL_REGEXP,
        });
        break;
      case text.startsWith("Validators.pattern"):
        rules.push({
          pattern: text
            .replace("Validators.pattern(", "")
            .replace(")", "")
            .trim(),
        });
        break;
      case text.startsWith("Validators.minLength("):
        rules.push({
          minLength: text
            .replace("Validators.minLength(", "")
            .replace(")", "")
            .trim(),
        });
        break;
      case text.startsWith("Validators.maxLength("):
        rules.push({
          maxLength: text
            .replace("Validators.maxLength(", "")
            .replace(")", "")
            .trim(),
        });
        break;
      default:
        rules.push({
          validator: text.replace("this.", ""),
        });
        break;
    }
  };
  const processControlValue = (key: string, elements: NodeArray<Node>) => {
    let rules: any[] = [];
    elements.forEach((item, index) => {
      if (index == 0) {
        formValue[key] = item.getText();
        return;
      }
      if (isArrayLiteralExpression(item)) {
        for (let e of item.elements) {
          processValidator(rules, e);
        }
      } else {
        processValidator(rules, item);
      }
    });
    if (rules.length) {
      ruleMap.set(key, rules);
    }
  };
  for (let node of (objNode as ObjectLiteralExpression).properties) {
    let key = (node.name as Identifier).getText();
    let initializer = (node as PropertyAssignment).initializer;
    if (isNewExpression(initializer)) {
      processControlValue(key, initializer.arguments);
      continue;
    }
    if (isArrayLiteralExpression(initializer)) {
      processControlValue(key, initializer.elements);
      continue;
    }
    if (isCallExpression(initializer)) {
      if (
        initializer.arguments.length == 1 &&
        isArrayLiteralExpression(initializer.arguments[0])
      ) {
        formValue[key] = [];
      }
      continue;
    }
    formValue[key] = (initializer as LiteralExpression).text;
  }
  return { formValue, ruleMap };
}

function processCreateForm(node: Node, ssrName) {
  if (node.kind !== SyntaxKind.BinaryExpression) {
    return;
  }
  if (
    (node as BinaryExpression).left.kind !== SyntaxKind.PropertyAccessExpression
  ) {
    return;
  }
  let name = ((node as BinaryExpression).left as PropertyAccessExpression).name
    .text;
  if (!htmlContext.htmlParser.tagCollectMap.get(TagType.form)?.has(name)) {
    return;
  }
  // if (this.varParser.vForm.has(name)) {
  //   return;
  // }
  if (
    !(node as BinaryExpression).right
      .getText()
      .startsWith(`this.${ssrName}.group`)
  ) {
    return;
  }
  const str = this.varParser.parseFormSource(
    name,
    (node as BinaryExpression).right.getText()
  );
  return {
    start: (node as BinaryExpression).right.pos,
    end: (node as BinaryExpression).right.end,
    content: str,
    origin: (node as BinaryExpression).right.getText(),
  };
}

function findPropNodeAndName(node: Node, propName: string) {
  const formMap = htmlContext.htmlParser.tagCollectMap.get(TagType.form);
  if (!formMap) {
    return;
  }
  if (
    node.kind !== SyntaxKind.PropertyAccessExpression ||
    (node as PropertyAccessExpression).expression.kind !==
      SyntaxKind.ThisKeyword
  ) {
    return;
  }
  let formName = (node as PropertyAccessExpression).name.getText();
  if (!formMap.has(formName)) {
    return;
  }
  if (
    (node as PropertyAccessExpression).parent.kind !==
    SyntaxKind.PropertyAccessExpression
  ) {
    return;
  }
  let propNode = (node as PropertyAccessExpression)
    .parent as PropertyAccessExpression;
  if (propNode.name.getText() != propName) {
    return;
  }
  return { propNode, formName };
}

function processFormGroupProp(node: Node, propName: string) {
  const tmp = findPropNodeAndName(node, propName);
  if (!tmp) {
    return;
  }
  const { formName, propNode } = tmp;
  if (propName == "value") {
    return {
      start: propNode.pos,
      end: propNode.end,
      content: formName,
      origin: propNode.getText(),
    };
  }
  if (propNode.parent.kind !== SyntaxKind.CallExpression) {
    return;
  }
  const callNode = propNode.parent as CallExpression;
  if (propName === "getRawValue") {
    return {
      start: callNode.pos,
      end: callNode.end,
      content: formName,
      origin: callNode.getText(),
    };
  }
  if (!["setValue", "patchValue", "reset"].includes(propName)) {
    return;
  }
  this.importParser.add("FormProxy", "@icc/utils");
  let str = "";
  if (callNode.arguments.length > 0) {
    // 有参数的形式 this.loginForm.reset({name: '', password: ''})
    str = `FormProxy.${propName}(${formName}, ${callNode.arguments[0].getText()})`;
  } else {
    // 没有参数的形式 this.loginForm.reset();
    str = `FormProxy.${propName}(${formName})`;
  }
  return {
    start: callNode.pos,
    end: callNode.end,
    content: str,
    origin: callNode.getText(),
  };
}

function processFormControlProp(node: Node, propName: string) {
  const tmp = findPropNodeAndName(node, "get");
  if (!tmp) {
    return;
  }
  const { formName, propNode } = tmp;
  if (propNode.parent.kind !== SyntaxKind.CallExpression) {
    return;
  }
  let key = (propNode.parent as CallExpression).arguments[0].getText();
  key = key.replace(/"|'/g, "");
  if (
    (propNode.parent as CallExpression).parent.kind !==
    SyntaxKind.PropertyAccessExpression
  ) {
    return;
  }
  const controlPropNode = (propNode.parent as CallExpression)
    .parent as PropertyAccessExpression;
  if (controlPropNode.name.getText() === "value") {
    return {
      start: controlPropNode.pos,
      end: controlPropNode.end,
      content: `${formName}.${key}`,
      origin: controlPropNode.getText(),
    };
  }
  if (controlPropNode.parent.kind !== SyntaxKind.CallExpression) {
    return;
  }
  const callNode = controlPropNode.parent as CallExpression;
  if (propName === "getRawValue") {
    return {
      start: callNode.pos,
      end: callNode.end,
      content: `${formName}.${key}`,
      origin: callNode.getText(),
    };
  }
  if (!["setValue", "patchValue", "reset"].includes(propName)) {
    return;
  }
  this.importParser.add("FormProxy", "@icc/utils");
  let str = "";
  if (callNode.arguments.length > 0) {
    // 有参数的形式 this.loginForm.reset({name: '', password: ''})
    str = `FormProxy.${propName}ForItem(${formName}, ${callNode.arguments[0].getText()})`;
  } else {
    // 没有参数的形式 this.loginForm.reset();
    str = `FormProxy.${propName}ForItem(${formName})`;
  }
  return {
    start: callNode.pos,
    end: callNode.end,
    content: str,
    origin: callNode.getText(),
  };
}

export function processFormBuilder(ssrName: string) {
  return (node: Node): SSrvResult => {
    let result = null;
    /**(1) 针对表单的赋值语句
     * this.loginForm = this.fb.group({
        ioldPassword: new UntypedFormControl("", [Validators.required]),
        inewPassword: new UntypedFormControl("", [
          Validators.required,
          Validators.pattern("^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?![\(\)])(?!([^(0-9a-zA-Z)]|[\(\)])+$)([^(0-9a-zA-Z\\s)]|[\(\)]|[a-z]|[A-Z]|[0-9]){8,16}$"),
        ]),
        iconfirmPassword: new UntypedFormControl("", [
          Validators.required,
          Validators.pattern("^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?![\(\)])(?!([^(0-9a-zA-Z)]|[\(\)])+$)([^(0-9a-zA-Z\\s)]|[\(\)]|[a-z]|[A-Z]|[0-9]){8,16}$"),
        ]),
      })
     */
    result = processCreateForm.call(this, node, ssrName);
    if (result) {
      return result;
    }
    /**(2) 针对表单FormGroup操作方法和属性的语句'value', 'getRawValue', "setValue", "patchValue", "reset"
     * 比如this.loginForm.reset()
     */
    for (let propName of [
      "value",
      "getRawValue",
      "setValue",
      "patchValue",
      "reset",
    ]) {
      result = processFormGroupProp.call(this, node, propName);
      if (result) {
        return result;
      }
      /**(3) 针对FormControl语句操作的方法和属性
       * this.loginForm.get("ioldPassword")?.value
       */
      result = processFormControlProp.call(this, node);
      if (result) {
        return result;
      }
    }

    return;
  };
}

export function replaceFormBuilder(ssrName: string) {
  return (blockSource: string): string => {
    // 处理响应式表单
    htmlContext.htmlParser.tagCollectMap
      .get(TagType.form)
      .forEach((_, key: string) => {
        blockSource = blockSource.replace(
          new RegExp(`this.${key}.`, "g"),
          `${key}Proxy.`
        );
      });
    // 前面无法解析的fb.group，直接去掉
    blockSource = blockSource.replace(new RegExp(`this.${ssrName}.group`), "");
    return blockSource;
  };
}
