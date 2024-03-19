import { ComponentNg2Vue } from ".";
import { createSourceTree, findNodeBFS } from "./ts/util";
import {
  ArrayLiteralExpression,
  ArrowFunction,
  BinaryExpression,
  CallExpression,
  ConditionalExpression,
  ElementAccessExpression,
  ExpressionStatement,
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  SyntaxKind,
} from "typescript";

// 收集器(从html中收集变量)
export class Collect {
  ng2Vue: ComponentNg2Vue;
  // 在html模板中使用到的变量收集起来
  useInHtmlVars: Set<string> = new Set();
  // 模板引用变量 变量名->组件名（标签名）（这里有个反向操作，angular中有一些是通过组件类名获取组件引用，从TS到html加上模板引用）
  // refVars: Map<string, HEleNode> = new Map();
  // 方法名
  useInHtmlMethods: Set<string> = new Set();

  constructor(parent) {
    this.ng2Vue = parent;
  }

  init() {
    this.useInHtmlVars = new Set();
    // this.refVars = new Map();
    this.useInHtmlMethods = new Set();
  }

  //处理：
  dealBindValue(val: string) {
    val = val && val.trim();
    // 构造函数调用，方便准确解析到val值
    const root: Node = createSourceTree(`test(${val})`);
    const callNode = findNodeBFS(
      root,
      (node: Node) => node.kind === SyntaxKind.CallExpression
    ) as CallExpression;
    const target = callNode.arguments[0];
    if (!target) {
      return;
    }
    const dealObj = (node: ObjectLiteralExpression) => {
      for (let item of node.properties) {
        if (item.kind === SyntaxKind.PropertyAssignment) {
          this.dealExpression(
            (item as PropertyAssignment).initializer.getText()
          );
        } else if (item.kind === SyntaxKind.ShorthandPropertyAssignment) {
          this.dealExpression((item as ShorthandPropertyAssignment).getText());
        }
      }
    };
    switch (target.kind) {
      case SyntaxKind.ObjectLiteralExpression:
        // (1) 处理这种情况 { display: isWarningName ? 'block' : 'none' }
        dealObj(target as ObjectLiteralExpression);
        break;
      case SyntaxKind.ArrayLiteralExpression:
        // (2) 处理数组情况 [{ url: mediaPrefix + mediaUrl }]
        for (let item of (target as ArrayLiteralExpression).elements) {
          if (item.kind === SyntaxKind.ObjectLiteralExpression) {
            dealObj(item as ObjectLiteralExpression);
          } else {
            this.dealExpression(item.getText());
          }
        }
        break;
      default:
        this.dealExpression(val);
        break;
    }
  }

  dealMethods(val: string) {
    if (!val) {
      return;
    }
    val = val.trim();
    const root = createSourceTree(val);
    const node = findNodeBFS(
      root,
      (node: Node) => node.kind === SyntaxKind.ExpressionStatement
    ) as ExpressionStatement;
    // (1) 只是方法名 直接加入
    if (!node || node.expression.kind === SyntaxKind.Identifier) {
      this.useInHtmlMethods.add(val);
      return;
    }
    // (2) 箭头函数
    if (
      node.expression.kind === SyntaxKind.ArrowFunction &&
      (node.expression as ArrowFunction).body.kind === SyntaxKind.CallExpression
    ) {
      this.dealExpression((node.expression as ArrowFunction).body.getText());
    }
  }

  // 有可能传入一个变量；也可能传入一个函数
  addUseInHtmlVars(name: string) {
    if (this.ng2Vue.tsParser.properties.find((e) => e.name == name)) {
      this.useInHtmlVars.add(name);
    } else if (this.ng2Vue.tsParser.methods.find((e) => e.name == name)) {
      this.useInHtmlMethods.add(name);
    }
  }

  dealExpression(expr: string) {
    if (!expr) {
      return false;
    }
    const dealCell = (node: Node) => {
      // （1）只是变量 v-if="hasFloorurl"
      if (node.kind === SyntaxKind.Identifier) {
        this.addUseInHtmlVars(node.getText());
        return;
      }
      // (2) v-if="validErrorTip.msg"
      if (node.kind === SyntaxKind.PropertyAccessExpression) {
        const temp = str.split(".");
        // 如果是v-if="item.loading" 变量是for循环产生的临时变量，则不加入
        if (this.ng2Vue.tsParser.properties.find((e) => e.name == temp[0])) {
          this.addUseInHtmlVars(temp[0]);
        }
        return;
      }
      // (3) v-if="arr[i]"
      if (
        node.kind === SyntaxKind.ElementAccessExpression &&
        (node as ElementAccessExpression).expression.kind ===
          SyntaxKind.Identifier
      ) {
        let name = (node as ElementAccessExpression).expression.getText();
        if (this.ng2Vue.tsParser.properties.find((e) => e.name == name)) {
          this.addUseInHtmlVars(name);
        }
        return;
      }
    };
    let str = expr.trim();
    // 分割表达式  record.id >=0 && edit
    const arr = str.replace(/!|!!/g, "").split(/\|\||&&/g);
    for (let s of arr) {
      const root = findNodeBFS(
        createSourceTree(s.trim()),
        (node: Node) => node.kind === SyntaxKind.ExpressionStatement
      ) as ExpressionStatement;
      // (1) v-if="record.id >= 0"
      if (root.expression.kind === SyntaxKind.BinaryExpression) {
        dealCell((root.expression as BinaryExpression).left);
        dealCell((root.expression as BinaryExpression).right);
        continue;
      }
      if (root.expression.kind === SyntaxKind.CallExpression) {
        let callNode = root.expression as CallExpression;
        // (2) v-if="hasTip(xxx)"
        if (callNode.expression.kind === SyntaxKind.Identifier) {
          // 方法名
          this.useInHtmlMethods.add(callNode.expression.getText());
          // 参数
          for (let arg of callNode.arguments) {
            dealCell(arg);
          }
        }
        // (3) control.hasError('required')
        if (callNode.expression.kind === SyntaxKind.PropertyAccessExpression) {
          let temp = s.trim().split(".");
          if (this.ng2Vue.tsParser.properties.find((e) => e.name == temp[0])) {
            this.addUseInHtmlVars(temp[0]);
          }
        }
        continue;
      }
      // 三目表达式 a > 0 ? xxx : yyy
      if (root.expression.kind === SyntaxKind.ConditionalExpression) {
        // 可能是这种情况 !isWarningName && !nameActive ? 'block' : 'none'
        this.dealExpression(
          (root.expression as ConditionalExpression).condition.getText()
        );
        this.dealExpression(
          (root.expression as ConditionalExpression).whenTrue.getText()
        );
        this.dealExpression(
          (root.expression as ConditionalExpression).whenFalse.getText()
        );
        continue;
      }
      dealCell(root.expression);
    }
  }
}
