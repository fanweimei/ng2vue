import { VarType, VarItem, SSrv } from "../typings";
import { ComponentNg2Vue } from "../../index";
import { TsParser } from "..";
import { parseReactiveFormSource } from "../cells/form";
import { createSourceTree, findNodeBFS, isChangeValue } from "../util";
import {  Block, CallExpression, Node, SyntaxKind } from "typescript";
import { jsBasetype } from "../const";
import * as strings from "../../../share/strings";
import { parseSfSchema } from "../cells/sf";
import { TagType } from "@ngParse/html/typings";
import { GetterDeclaration, SetterDeclaration } from "@typescript-parser";

export class TsParserVars {
  varMap = new Map<string, VarItem>();
  vSt = new Set<string>();
  vForm = new Set<string>();
  codeLines: string[] = [];

  constructor(public tsParser: TsParser, public ng2Vue: ComponentNg2Vue) { }

  parse() {
    // 1. 解析sf标签涉及到的变量ui/schema变量需要处理合二为一
    this.parseSf();
    // 2. 解析st标签涉及到的变量
    this.parseSt();
    // 3. 解析响应式表单内容
    this.parseForm();
    // 4. 这几类是一定存在的（props、模板组件引用的变量、emits）
    for (let item of this.tsParser.properties) {
      if (
        item.isInput ||
        item.isOutput ||
        item.viewChildren ||
        item.viewChild
      ) {
        let flag = false;
        if (item.isInput && isChangeValue(this.tsParser.source, item.name)) {
          flag = true;
        }
        this.parseVar(item.name, flag);
      }
    }

    // 5. 解析html中使用的其它变量
    this.ng2Vue.collect.useInHtmlVars.forEach((name: string) => {
      this.parseVar(name);
    });

    // 6. 解析ng中的get函数，对应computed
    this.parseAccessors();
  }

  parseVar(vName: string, changeValue = false) {
    if (this.varMap.has(vName)) {
      return this.varMap.get(vName);
    }
    const vNode = this.tsParser.properties.find((e) => e.name == vName);
    if (!vNode) {
      return null;
    }
    let obj: VarItem = {
      varType: VarType.common,
      value: vNode.value,
      type: vNode.type,
      name: vName,
      isOptional: vNode.isOptional,
      isStatic: vNode.isStatic,
    };
    // 放在前面防止进入死循环
    this.varMap.set(vName, obj);
    switch (true) {
      case vNode.isInput:
        obj.varType = changeValue ? VarType.model : VarType.prop;
        break;
      case !!vNode.viewChild || !!vNode.viewChildren:
        obj.varType = VarType.ref;
        obj.isLinkTemp = true;
        break;
      case vNode.isOutput:
        obj.varType = VarType.emit;
        break;
      case this.ng2Vue.collect.useInHtmlVars.has(vName):
        obj.varType = VarType.ref;
        break;
      default:
        obj.varType = VarType.common;
        break;
    }
    if (obj.value) {
      if (this.parseVarValue(obj) === false) {
        this.varMap.delete(vName);
        return null;
      }
    }
    return obj;
  }

  parseForm() {
    if (!this.ng2Vue.htmlParser.tagCollectMap.has(TagType.form)) {
      return;
    }
    this.ng2Vue.htmlParser.tagCollectMap
      .get(TagType.form)
      .forEach(({ node }, name: string) => {
        const varItem = this.tsParser.properties.find((e) => e.name == name);
        if (!varItem) {
          return;
        }
        if (varItem.value) {
          const str = this.parseFormSource(varItem.name, varItem.value);
          varItem.value = str;
        }
        const obj = this.parseVar(varItem.name);
        obj.type = undefined;
        obj.varType = VarType.reactive;
        this.vForm.add(varItem.name);

        const refAttr = node.attributes.find((e) => e.key == "ref");
        if (refAttr) {
          this.varMap.set(refAttr.value, {
            varType: VarType.ref,
            type: "FormInstance",
            name: refAttr.value,
          });
          this.tsParser.importParser.add("FormInstance", "ant-design-vue");
        }
      });
  }

  parseFormSource(name: string, content: string) {
    // step 1 解析form变量创建语句
    const obj = parseReactiveFormSource(content);
    if (!obj) {
      return;
    }
    const { formValue, ruleMap } = obj;
    if (ruleMap.size) {
      this.ng2Vue.htmlParser.checkFormRules(name, ruleMap);
    }
    // const formVar = {
    //   varType: VarType.reactive,
    //   name,
    //   value: formValue,
    // };
    let valueStr = "";
    for (let key in formValue) {
      valueStr += `${key}: ${formValue[key]},\n`;
    }
    // step2 添加form变量
    // this.varMap.set(name, {
    //   varType: VarType.reactive,
    //   name,
    //   value: `{
    //     ${valueStr}
    //   }
    //   `,
    // });
    // 如果代码中并没有引用就直接返回
    // if (this.tsParser.source.includes(`this.${name}.`)) {
    //   this.tsParser.varParser.parseVar(name);
    //   this.vForm.set(name, formVar);
    //   // step2 给form添加引用
    //   let formRef = addFormRef(name) || `${name}Ref`;
    //   this.varMap.set(formRef, {
    //     name: formRef,
    //     varType: VarType.ref,
    //     isLinkTemp: true,
    //     type: "FormInstance",
    //   });
    //   // step3 添加form代理对象
    //   this.varMap.set(`${name}Proxy`, {
    //     name: `${name}Proxy`,
    //     varType: VarType.proxy,
    //     type: `FormGroupProxy`,
    //     value: `new FormGroupProxy(${name}, ${formRef})`,
    //   });
    //   this.tsParser.importParser.add("FormGroupProxy", "@icc/utils");
    //   this.tsParser.importParser.add("FormInstance", "ant-design-vue");
    // }
    return `{\n${valueStr.trim()}\n}`;
  }

  async parseSf() {
    if (!this.ng2Vue.htmlParser.tagCollectMap.has(TagType.sf)) {
      return;
    }
    const sfMap = this.ng2Vue.htmlParser.tagCollectMap.get(TagType.sf).values();
    for (let { origin: item } of sfMap) {
      const uiAttr = item.attributes.find((e) => e.key == "[ui]");
      const schemaAttr = item.attributes.find((e) => e.key == "[schema]");
      if (!uiAttr || !schemaAttr) {
        continue;
      }
      const uiVar = this.tsParser.properties.find(
        (e) => e.name == uiAttr.value
      );
      const schemaVar = this.tsParser.properties.find(
        (e) => e.name == schemaAttr.value
      );
      if (!uiVar || !schemaVar) {
        continue;
      }
      schemaVar.value = parseSfSchema(uiVar.value, schemaVar.value);
      schemaVar.type = "FormSchema[]";
      this.tsParser.importParser.add(
        "FormSchema",
        "@icc/components/icc-schema-form"
      );
    }
  }

  async parseSt() {
    if (!this.ng2Vue.htmlParser.tagCollectMap.has(TagType.st)) {
      return;
    }
    this.ng2Vue.htmlParser.tagCollectMap
      .get(TagType.st)
      .forEach((_, key: string) => {
        let stVar = this.tsParser.properties.find((e) => e.viewChild == key);
        if (stVar) {
          // 更新html节点ref的名称
          this.vSt.add(stVar.name);
        }
        for (let attr of _.node.attributes) {
          let v = this.tsParser.properties.find((e) => e.name == attr.value);
          if (!v) {
            continue;
          }
          let tmp: VarItem;
          switch (attr.key) {
            case ":columns":
              v.type = "TableColumn[]";
              this.tsParser.importParser.add(
                "TableColumn",
                "@icc/components/icc-dynamic-table"
              );
              break;
            case "ref":
              this.tsParser.importParser.add(
                "DynamicTableInstance",
                "@icc/components/icc-dynamic-table"
              );
              v.type = "DynamicTableInstance";
              break;
            case ":res":
              this.tsParser.importParser.add(
                "Res",
                "@icc/components/icc-dynamic-table"
              );
              v.type = "Res";
              //这里提前处理变量， res、req改成普通类型
              if (stVar) {
                tmp = this.parseVar(attr.value);
                if (tmp) {
                  tmp.varType = VarType.common;
                }
              }
              break;
            case ":req":
              this.tsParser.importParser.add(
                "Req",
                "@icc/components/icc-dynamic-table"
              );
              v.type = "Req";
              // if (stVar) {
              //   tmp = this.parseVar(attr.value);
              //   if (tmp) {
              //     tmp.varType = VarType.common;
              //   }
              // }
              break;
          }
        }
        // this.generateStRequestMethod(node, origin, stVar);
      });
  }

  // 解析ng中的get 函数
  parseAccessors() {
    if (!this.tsParser.classDeclarations.accessors?.length) {
      return;
    }
    for (let item of this.tsParser.accessors) {
      if(item instanceof SetterDeclaration) {
        this.parseSetter(item);
      } else if(item instanceof GetterDeclaration) {
        this.parseGetter(item);
      }
    }
  }

  // 解析ng中的set函数，对应vue环境watch
  parseSetter(item: SetterDeclaration) {
    let content = this.tsParser.source.slice(item.start, item.end);
    // 去掉@Input()
    if(item.isInput) {
      content = content.replace('@Input()', '').trim();
    }
    // 去掉set 开头的四个字符
    content = content.slice(4);
    const root: Node = createSourceTree(content);
    const blockNode = 
      findNodeBFS(
        root,
        (node: Node) => node.kind === SyntaxKind.Block
      ) as Block;
    let valueStr = this.tsParser.methodParser.processCodeBlock(blockNode);
    const callNode = findNodeBFS(root, (node:Node) => node.kind === SyntaxKind.CallExpression) as CallExpression;
    let paramName = '', type;
    if(callNode.arguments?.length >= 1) {
      // 对应情况：insertText(v)
      paramName = callNode.arguments[0].getText();
    }
    if(callNode.arguments?.length >= 2) {
      // 对应情况：insertText(v: number)
      type = callNode.arguments[1].getText();
    }

    // 拼接watch的第二个箭头函数
    if(!paramName) {
      valueStr = `() => ${valueStr}`;
    } else {
      if(!type) {
        valueStr = `(${paramName}) => ${valueStr}`;
      } else {
        valueStr = `(${paramName}:${type}) => ${valueStr}`;
      }
    }
    // 生成变量
    if(item.isInput) {
      // 如果是@Input，添加一条prop的变量，以及添加一条watchprop的变量
      this.varMap.set(item.name, {
        varType: VarType.prop,
        type: type,
        name: item.name,
        isOptional: false,
        isStatic: false,
      });
      this.varMap.set(`${item.name}_watchprop`, {
        varType: VarType.watchprop,
        type: type,
        value: valueStr,
        name: item.name,
        isOptional: false,
        isStatic: false,
      });
    } else {
      // 如果不是@Input，添加一条ref的变量，以及添加一条watchprop的变量
      this.varMap.set(item.name, {
        varType: VarType.ref,
        type: type,
        name: item.name,
        isOptional: false,
        isStatic: false,
      });
      this.varMap.set(`${item.name}_watchref`, {
        varType: VarType.watchref,
        type: type,
        value: valueStr,
        name: item.name,
        isOptional: false,
        isStatic: false,
      });
    }
  }

  // 解析ng中的get函数，对应vue环境中computed
  parseGetter(item: GetterDeclaration) {
    let content = this.tsParser.source.slice(item.start + 4, item.end); // 加4去掉开头的get 共4个字符
    const root: Node = createSourceTree(content);
    const blockNode = 
      findNodeBFS(
        root,
        (node: Node) => node.kind === SyntaxKind.Block
      ) as Block;
    const valueStr = this.tsParser.methodParser.processCodeBlock(blockNode);
    let obj: VarItem = {
      varType: VarType.computed,
      value: valueStr,
      name: item.name,
      isStatic: item.isStatic,
    };
    // 放在前面防止进入死循环
    this.varMap.set(item.name, obj);
  }

  generateCode() {
    this.varMap.forEach((item) => {
      if (item.value) {
        item.value = this.tsParser.importParser.filterDiscardtypeContent(
          item.value
        );
      }
      if (item.type) {
        item.type = this.tsParser.importParser.filterDiscardtypeContent(
          item.type
        );
      }
    });
    let vars = [...this.varMap.values()];
    let content = "",
      str = "";
    if (this.tsParser.decorator.selector) {
      content += `defineOptions({\n\tname: '${strings.classify(
        this.tsParser.decorator.selector
      )}',\n});\n\n`;
    }

    str = this.generatePropsStr(
      vars.filter(
        (e) => e.varType === VarType.prop || e.varType === VarType.model
      )
    );
    if (str) {
      content += `${str}\n`;
    }
    str = this.generateEmitsStr(
      vars.filter(
        (e) => e.varType === VarType.emit || e.varType === VarType.model
      )
    );
    if (str) {
      content += `${str}\n`;
    }
    str = this.generateCommonVarStr(
      vars.filter((e) => e.varType === VarType.common)
    );
    if (str) {
      content += `${str}\n`;
    }
    str = this.generateRefStr(
      vars.filter((e) => e.varType == VarType.ref && !e.isLinkTemp)
    );
    if (str) {
      content += `${str}\n`;
    }
    str = this.generateRefStr(
      vars.filter((e) => e.varType == VarType.ref && e.isLinkTemp)
    );
    if (str) {
      content += `${str}\n`;
    }
    str = this.generateReactiveStr(
      vars.filter((e) => e.varType === VarType.reactive)
    );
    if (str) {
      content += `${str}\n`;
    }
    str = this.generateModelStr(
      vars.filter((e) => e.varType === VarType.model)
    );
    if (str) {
      content += `${str}\n`;
    }
    str = this.generateProxyVarStr(
      vars.filter((e) => e.varType === VarType.proxy)
    );
    if (str) {
      content += `${str}\n`;
    }
    str = this.generateComputedStr(vars.filter(e => e.varType === VarType.computed));
    if(str) {
      content += `${str}\n`;
    }
    str = this.generateWatchStr(vars.filter(e => e.varType === VarType.watchprop || e.varType === VarType.watchref));
    if(str) {
      content += `${str}\n`;
    }
    return content.trim();
  }

  //props
  generatePropsStr(vars: VarItem[]) {
    let content = "";
    for (let item of vars) {
      let str = "";
      if (item.type) {
        let t = jsBasetype.find((e) => e == item.type);
        if (t || item.type == "Function") {
          // 基础类型或者函数
          str += `\t\ttype: ${t[0].toUpperCase() + t.slice(1)},\n`;
        } else {
          str += `\t\ttype: Object as PropType<${item.type}>,\n`;
          this.tsParser.importParser.add("PropType", "vue");
        }
      }
      if (item.value !== undefined) {
        if (jsBasetype.includes(item.type)) {
          str += `\t\tdefault: ${item.value}`;
        } else {
          str += `\t\tdefault: () => (${item.value})`;
        }
      }
      content += `\t${item.name}: {\n\t${str.trim()}\n\t},\n`;
    }
    content = content.trim();
    if (content) {
      return `const props = defineProps({\n\t${content}\n});`;
    } else {
      return "";
    }
  }

  // emits
  generateEmitsStr(vars: VarItem[]) {
    const arr = vars.map((e) =>
      e.varType == VarType.emit ? e.name : `update:${e.name}`
    );
    if (this.tsParser.srv.has(SSrv.modalRef)) {
      arr.push("close");
    }
    return arr.length
      ? `const emits = defineEmits([${arr.map((e) => `"${e}"`).join(",")}]);`
      : "";
  }

  generateModelStr(vars: VarItem[]) {
    if (!vars.length) {
      return "";
    }
    let content = "";
    for (let item of vars) {
      content += `\nconst ${item.name} = ref(props.${item.name});\nwatch(() => props.${item.name}, () => {\n${item.name}.value = props.${item.name};\n});\n`;
    }
    this.tsParser.importParser.add("watch", "vue");
    this.tsParser.importParser.add("ref", "vue");
    return content;
  }

  // let test: string = 'hello';
  generateCommonVarStr(commonVars: VarItem[]) {
    let content = "";
    for (let item of commonVars) {
      let str = `let ${item.name}`;
      if (item.type) {
        str += `: ${item.type}`;
      }
      if (item.value !== undefined) {
        str += ` = ${item.value}`;
      }
      content += `${str};\n`;
    }
    return content.trim();
  }
  generateProxyVarStr(commonVars: VarItem[]) {
    let content = "";
    for (let item of commonVars) {
      let str = `const ${item.name}`;
      if (item.type) {
        str += `: ${item.type}`;
      }
      if (item.value !== undefined) {
        str += ` = ${item.value}`;
      }
      content += `${str};\n`;
    }
    return content.trim();
  }

  // 解析value
  parseVarValue(item: VarItem) {
    if (!item.value) {
      return;
    }
    const root: Node = createSourceTree(`test(${item.value})`);
    const blockNode = (
      findNodeBFS(
        root,
        (node: Node) => node.kind === SyntaxKind.CallExpression
      ) as CallExpression
    ).arguments[0];
    const valueStr = this.tsParser.methodParser.processCodeBlock(blockNode);
    switch (blockNode.kind) {
      case SyntaxKind.NumericLiteral:
        item.type = item.type || "number";
        break;
      case SyntaxKind.StringLiteral:
        item.type = item.type || "string";
        break;
      case SyntaxKind.FalseKeyword:
      case SyntaxKind.TrueKeyword:
        item.type = item.type || "boolean";
        break;
      case SyntaxKind.ObjectLiteralExpression:
        item.varType =
          item.varType === VarType.ref ? VarType.reactive : item.varType;
        break;
      case SyntaxKind.ArrowFunction:
        // 是一个箭头函数的属性，那应该假如方法中
        this.tsParser.methodParser.fnMap.set(item.name, {
          name: item.name,
          content: `const ${item.name} = ${valueStr}`,
          isArrow: true,
          blockContent: valueStr,
        });
        return false;
    }
    item.value = valueStr;
  }

  // ref
  generateRefStr(vars: VarItem[]) {
    if (!vars.length) {
      return "";
    }
    let content = "";
    for (let item of vars) {
      if (item.type) {
        content += `const ${item.name} = ref<${item.type}>(${item.value === undefined ? "" : item.value
          });\n`;
      } else {
        content += `const ${item.name} = ref(${item.value === undefined ? "" : item.value
          });\n`;
      }
    }
    this.tsParser.importParser.add("ref", "vue");
    return content.trim();
  }

  // reactive
  generateReactiveStr(vars: VarItem[]) {
    if (!vars.length) {
      return "";
    }
    let content = "";
    for (let item of vars) {
      if (item.type) {
        content += `const ${item.name} = reactive<${item.type}>(${item.value || "{}"
          });\n`;
      } else {
        content += `const ${item.name} = reactive(${item.value || "{}"});\n`;
      }
    }
    this.tsParser.importParser.add("reactive", "vue");
    return content.trim();
  }

  // computed
  generateComputedStr(vars: VarItem[]) {
    if(!vars.length) {
      return "";
    }
    let content = "";
    for(let item of vars) {
      content += `const ${item.name} = computed(() => ${item.value});\n`;
    }
    this.tsParser.importParser.add("computed", "vue");
    return content.trim();
  }

  // watch
  generateWatchStr(vars: VarItem[]) {
    if(!vars.length) {
      return "";
    }
    let content = "";
    for(let item of vars) {
      if(item.varType === VarType.watchprop) {
        content += `watch(() => props.${item.name}, ${item.value});\n`;
      } else {
        content += `watch(() => ${item.name}.value, ${item.value});\n`;
      }
    }
    this.tsParser.importParser.add("watch", "vue");
    return content.trim();
  }
}
