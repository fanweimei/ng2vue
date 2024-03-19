import { ComponentNg2Vue } from "../../index";
import { TsParser } from "..";
import { MethodItem, VarType } from "../typings";
import { createSourceTree, findNodeBFS } from "../util";
import {
  SyntaxKind,
  Node,
  // Block,
  PropertyAccessExpression,
} from "typescript";
import { ngLifeMethods } from "../const";
import { replaceGlobal } from "../cells";
import { TagType } from "@ngParse/html/typings";
import { replaceTreeMethod } from "../cells/tree";

interface SpecialCodeBlock {
  start?: number;
  end?: number;
  content: string;
  origin: string;
}

export class TsParserMethods {
  fnMap = new Map<string, MethodItem>();
  constructor(public tsParser: TsParser, public ng2Vue: ComponentNg2Vue) {}

  // 处理方法，从模板中引用的方法开始
  parse() {
    // 模板中引用的方法
    for (let fnName of this.ng2Vue.collect.useInHtmlMethods) {
      this.processMethod(fnName);
    }

    //生命周期函数
    for (let fnNode of this.tsParser.methods) {
      if (ngLifeMethods.includes(fnNode.name)) {
        this.processMethod(fnNode.name);
      }
    }

    this.processTree();
  }

  processTree() {
    // tree上的方法做进一步输出a-tree上的@select/@check方法的参数变了
    const treeNodeMap = this.ng2Vue.htmlParser.tagCollectMap.get(TagType.tree);
    if (!treeNodeMap || !treeNodeMap.size) {
      return;
    }
    treeNodeMap.forEach((item) => {
      let selectAttr = item.node.attributes.find((e) => e.key === "@select");
      let checkAttr = item.node.attributes.find((e) => e.key === "@check");
      let refName = item.node.attributes.find((e) => e.key === "ref")?.value;
      if (!selectAttr && !checkAttr) {
        return;
      }
      // 找到select对应的函数名，可能直接是函数名，也可能是箭头函数
      this.fnMap.forEach((item, fnName) => {
        if (selectAttr && selectAttr.value.includes(fnName)) {
          replaceTreeMethod(item, refName, selectAttr.key.slice(1));
        }
        if (checkAttr && checkAttr.value.includes(fnName)) {
          replaceTreeMethod(item, refName, selectAttr.key.slice(1));
        }
      });
    });
  }

  // 处理表单提交方法
  processFormSave(methodName: string, blockContent: string) {
    const formMap = this.ng2Vue.htmlParser.tagCollectMap.get(TagType.form);
    if (!formMap || !formMap.size) {
      return blockContent;
    }
    const formInfo = [...formMap.values()].find(
      ({ submitFnName }) => submitFnName == methodName
    );
    if (!formInfo) {
      return blockContent;
    }
    const refName = formInfo.node.attributes.find((e) => e.key == "ref");
    const root = createSourceTree(blockContent);
    const blockNode = findNodeBFS(
      root,
      (node: Node) => node.kind === SyntaxKind.Block
    );
    let source = blockNode.getText();
    let start = source.indexOf("{");
    let end = source.lastIndexOf("}");
    const target = `{
      ${refName.value}.value?.validateFields().then(() => {
        ${source.slice(start + 1, end)}
      });
    }`;
    return blockContent.replace(source, target);
  }

  processCodeBlock(blockNode: Node) {
    let useNames: string[] = [];
    let specialCodeArr: Array<SpecialCodeBlock> = [];
    let visit = (node: Node) => {
      // 1.1 构造函数需要特殊处理的代码，需要语法替换的代码片段收集到specialCodeArr数组中
      for (let fn of this.tsParser.processCtorArr) {
        let ssrvItem = fn(node);
        if (ssrvItem) {
          specialCodeArr.push(ssrvItem);
        }
      }
      // 1.2 收集方法中使用到的变量useNames，同时解析变量
      if (
        node.kind == SyntaxKind.PropertyAccessExpression &&
        (node as PropertyAccessExpression).expression.kind ==
          SyntaxKind.ThisKeyword
      ) {
        if (
          this.tsParser.varParser.parseVar(
            (node as PropertyAccessExpression).name.text
          )
        ) {
          useNames.push((node as PropertyAccessExpression).name.text);
        }
        // 1.3 方法体中是否有调用方法，递归处理调用的方法
        if (node.parent.kind == SyntaxKind.CallExpression) {
          this.processMethod((node as PropertyAccessExpression).name.text);
        }
      }
      if (node.getChildCount() > 0) {
        for (let item of node.getChildren()) {
          visit(item);
        }
      }
    };
    // 1. 开始处理方法体中的每个代码节点
    visit(blockNode);
    // 2. 替换特殊代码块（涉及到对构造函数中对象的调用，可能存在某一块代码需要挪动位置这样的情况）
    let blockSource = this.replaceSpecialBlock(
      blockNode.getText(),
      specialCodeArr
    );
    /** 3. 常规处理（某一行代码语句的替换），只是单行语法语句的替换
     * （1）变量的替换
     * （2）构造函数语句调用的替换
     * （3）this.替换
     */
    blockSource = this.replaceTempl(blockSource, useNames);
    // this.parseStParams(tempStMap, useNames);
    return blockSource;
  }

  processMethod(fnName: string) {
    if (this.fnMap.has(fnName)) {
      // 已经处理过了
      return;
    }
    let fnNode = this.tsParser.methods.find((e) => e.name == fnName);
    if (!fnNode) {
      return;
    }

    let fnSource = this.tsParser.source
      .slice(fnNode.start, fnNode.end)
      .replace(": void", "")
      .replace(":void", "");
    // 放前面防止进入死循环
    const fnItem = {
      name: fnName,
      content: fnSource,
      isAsync: false,
      blockContent: fnSource,
    };
    this.fnMap.set(fnName, fnItem);
    const root: Node = createSourceTree(fnSource);
    let blockSource = this.processCodeBlock(root);
    blockSource = this.processFormSave(fnName, blockSource);
    let isAsync = blockSource.startsWith("async");
    fnItem.content = `${isAsync ? "async " : ""}function ${blockSource.replace(
      /^async\s/,
      ""
    )}`;
    fnItem.isAsync = isAsync;
    fnItem.blockContent = blockSource;
    return fnItem;
  }

  // 处理特殊代码块 from Mehod表示是否来自方法的代码块
  replaceSpecialBlock(blockSource: string, specialCodeArr: SpecialCodeBlock[]) {
    if (!specialCodeArr.length) {
      return blockSource;
    }
    for (let item of specialCodeArr) {
      blockSource = blockSource.replace(item.origin, item.content);
    }
    return blockSource;
  }

  replaceTempl(blockSource: string, useNames: string[]) {
    /**
     * （1）全局性的代码替换
     * （2）变量
     * （3）构造函数中的变量
     * （4）this
     */
    blockSource = this.replaceGlobalCode(blockSource);
    blockSource = this.replaceVars(useNames, blockSource);
    blockSource = this.replaceCtor(blockSource);
    blockSource = this.replaceThis(blockSource);
    return blockSource;
  }

  replaceGlobalCode(blockSource: string) {
    for (let fn of replaceGlobal) {
      const callBack = fn.call(this.tsParser);
      blockSource = callBack(blockSource);
    }
    return blockSource;
  }

  // 替换变量中的用法
  replaceVars(useVars: string[] = [], blockSource: string = "") {
    // 先给变量名按字符串的长度排序，防止出现比如['id', 'idUrl']这种情况
    useVars.sort((a, b) => b.length - a.length);

    for (let n of useVars) {
      let varItem = this.tsParser.varParser.varMap.get(n);
      if (!varItem) {
        continue;
      }
      switch (varItem.varType) {
        case VarType.prop:
          blockSource = blockSource.replace(
            new RegExp(`\\bthis.${n}\\b`, "g"),
            `props.${n}`
          );
          break;
        case VarType.model:
        case VarType.ref:
          if (varItem.isLinkTemp) {
            blockSource = blockSource.replace(
              new RegExp(`this\\.${n}\\.`, "g"),
              `${n}.value?.`
            );
          }
          blockSource = blockSource.replace(
            new RegExp(`\\bthis.${n}\\b`, "g"),
            `${n}.value`
          );

          break;
        case VarType.emit:
          blockSource = blockSource.replace(
            new RegExp(`this.${n}.emit\\((.*)\\)`, "g"),
            (_, s1) => {
              if (s1) {
                return `emits('${n}', ${s1})`;
              }
              return `emits('${n}')`;
            }
          );
          break;
      }
    }
    return blockSource;
  }

  //替换构造函数中的一些方法使用
  replaceCtor(blockSource: string = "") {
    for (let fn of this.tsParser.replaceCtorArr) {
      blockSource = fn(blockSource);
    }
    return blockSource;
  }

  // 处理this
  replaceThis(blockSource: string = "") {
    return blockSource.replace(/this\./g, "");
  }

  // 代码生成
  generateCode() {
    const fns = [...this.fnMap.values()];
    let content = this.generateNgLifeCode(
      fns.filter((item) => ngLifeMethods.includes(item.name))
    );
    content += this.generateCommonCode(
      fns.filter((item) => !ngLifeMethods.includes(item.name))
    );
    return content.trim();
  }

  generateNgLifeCode(methods: MethodItem[]) {
    let content = "";
    for (let item of methods) {
      if (item.name != "ngOnInit") {
        let index = item.content.indexOf("{");
        item.content = item.content.slice(index);
      }
      switch (item.name) {
        case "ngOnChanges":
          item.content = item.content.replace(/changes/g, "props");
          item.content = item.content.replace(/\??\.currentValue/g, "");
          item.content = `watchEffect(() => ${this.tsParser.importParser.filterDiscardtypeContent(
            item.content
          )})`;
          content += `${item.content}\n\n`;
          this.tsParser.importParser.add("watchEffect", "vue");
          break;
        case "ngAfterViewInit":
        case "ngAfterContentInit":
          item.content = `onMounted(() => ${this.tsParser.importParser.filterDiscardtypeContent(
            item.content
          )})`;
          content += `${item.content}\n\n`;
          this.tsParser.importParser.add("onMounted", "vue");
          break;
        case "ngAfterContentChecked":
        case "ngAfterViewChecked":
          item.content = `onUpdated(() => ${this.tsParser.importParser.filterDiscardtypeContent(
            item.content
          )})`;
          content += `${item.content}\n\n`;
          this.tsParser.importParser.add("onUpdated", "vue");
          break;
        case "ngOnDestroy":
          item.content = `onUnmounted(() => ${this.tsParser.importParser.filterDiscardtypeContent(
            item.content
          )})`;
          content += `${item.content}\n\n`;
          this.tsParser.importParser.add("onUnmounted", "vue");
          break;
        case "ngOnInit":
          // 初始化函数直接执行
          content += `${this.tsParser.importParser.filterDiscardtypeContent(
            item.content
          )}\n`;
          content += `${item.name}();\n\n`;
          break;
      }
    }
    return content;
  }

  generateCommonCode(methods: MethodItem[]) {
    let content = "";
    for (let item of methods) {
      content += `${this.tsParser.importParser.filterDiscardtypeContent(
        item.content
      )}\n\n`;
    }
    return content;
  }
}
