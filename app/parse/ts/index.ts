import * as fs from "fs";
import * as path from "path";
import {
  ClassDeclaration,
  File,
  MultiLineImportRule,
  NamedImport,
  TypescriptCodeGenerator,
  TypescriptParser,
} from "@typescript-parser";
import { ComponentNg2Vue } from "..";
import { TsParserVars } from "./parts/vars";
import { TsParserMethods } from "./parts/methods";
import { TsParserImports } from "./parts/imports";
import { SSrv, SSrvResult } from "./typings";
import { Node, ObjectLiteralExpression, SyntaxKind } from "typescript";
import { processCtorSsrv, replaceCtorSsrv } from "./cells";
import { createSourceTree, findNodeBFS } from "./util";

export class TsParser {
  ng2Vue: ComponentNg2Vue;
  source: string;
  file: File;
  parser: TypescriptParser;
  codeGenerator: TypescriptCodeGenerator;
  varParser: TsParserVars;
  methodParser: TsParserMethods;
  importParser: TsParserImports;
  classDeclarations: ClassDeclaration;
  isModalComponent = false; // 是否是一个弹窗组件，弹窗组件，需要在emits加上close事件

  get methods() {
    return this.classDeclarations.methods;
  }

  get properties() {
    return this.classDeclarations.properties;
  }

  get parameters() {
    return this.classDeclarations.ctor?.parameters || [];
  }

  get decorator() {
    return this.classDeclarations.decorator;
  }

  get accessors() {
    return this.classDeclarations.accessors;
  }

  srv: Map<SSrv, string> = new Map();
  processCtorArr: Array<(node: Node) => SSrvResult> = [];
  replaceCtorArr: Array<(blockSource: string) => string> = [];

  constructor(parent: ComponentNg2Vue) {
    this.ng2Vue = parent;
    this.varParser = new TsParserVars(this, parent);
    this.methodParser = new TsParserMethods(this, parent);
    this.importParser = new TsParserImports(this, parent);

    this.codeGenerator = new TypescriptCodeGenerator({
      stringQuoteStyle: `"`,
      eol: ";",
      spaceBraces: true,
      wrapMethod: MultiLineImportRule.oneImportPerLineOnlyAfterThreshold,
      multiLineWrapThreshold: 160,
      multiLineTrailingComma: false,
      tabSize: 2,
      insertSpaces: false,
    });
  }

  async readToFile(content: string) {
    this.source = content;
    this.parser = new TypescriptParser();
    this.file = await this.parser.parseSource(content);
    this.classDeclarations = this.file.declarations.find(
      (n) => n instanceof ClassDeclaration
    ) as ClassDeclaration;

    /**
     * 如果配置了props，将变量的isInput改为true
     * 场景：表单页面
     */
    if (this.ng2Vue.cfg.props?.length) {
      for (let name of this.ng2Vue.cfg.props) {
        const property = this.properties.find((item) => item.name === name);
        if (property) {
          property.isInput = true;
        }
      }
    }
  }

  async parse() {
    this.processCtor();
    this.varParser.parse();
    this.methodParser.parse();
    this.importParser.parse();
  }

  processCtor() {
    this.processCtorArr = [];
    this.replaceCtorArr = [];
    for (let item of this.parameters) {
      this.srv.set(item.type as SSrv, item.name);
      if (processCtorSsrv[item.type]) {
        this.processCtorArr.push(
          processCtorSsrv[item.type].call(this, item.name)
        );
      }
      if (replaceCtorSsrv[item.type]) {
        this.replaceCtorArr.push(
          replaceCtorSsrv[item.type].call(this, item.name)
        );
      }
      switch (item.type) {
        case SSrv.modalHelper:
          this.importParser.add("useModal", "@icc/hooks");
          this.importParser.useCodeMap.set(
            item.name,
            `const [ ${item.name} ] = useModal();`
          );
          break;
        case SSrv.nzModal:
          this.importParser.add("Modal", "ant-design-vue");
          break;
        case SSrv.http:
          this.importParser.add("http", "@icc/api");
          break;
        case SSrv.notification:
        case SSrv.dialog:
          this.importParser.useCodeMap.set(
            item.name,
            `const ${item.name} = useNotification();`
          );
          this.importParser.add("useNotification", "@icc/hooks");
          break;
        case SSrv.encrypt:
          this.importParser.useCodeMap.set(
            item.name,
            `const ${item.name} = useEncrypt();`
          );
          this.importParser.add("useEncrypt", "@icc/hooks");
          break;
        case SSrv.confhelper:
          this.importParser.add("useMsgconfHelperService", "@icc/msg");
          this.importParser.useCodeMap.set(
            item.name,
            `const ${item.name} = useMsgconfHelperService();`
          );
          break;
        case SSrv.message:
          this.importParser.add("useMsgService", "@icc/msg");
          this.importParser.useCodeMap.set(
            item.name,
            `const ${item.name} = useMsgService();`
          );
          break;
        case SSrv.plugin:
          this.importParser.add("useMsgPluginFilterService", "@icc/hooks");
          this.importParser.useCodeMap.set(
            item.name,
            `const ${item.name} = useMsgPluginFilterService();`
          );
          break;
        case SSrv.acl:
          this.importParser.add("useAclService", "@icc/hooks");
          this.importParser.useCodeMap.set(
            item.name,
            `const ${item.name} = useAclService();`
          );
          break;
        case SSrv.router:
          this.importParser.add("useRouter", "vue-router");
          this.importParser.useCodeMap.set(
            item.name,
            `const ${item.name} = useRouter();`
          );
          break;
        case SSrv.route:
          this.importParser.add("useRoute", "vue-router");
          this.importParser.useCodeMap.set(item.name, `const ${item.name} = useRoute();`);
          break;
        case SSrv.token:
        case SSrv.iToken:
          this.importParser.add("useToken", "@icc/hooks");
          this.importParser.useCodeMap.set(
            item.name,
            `const ${item.name} = useToken();`
          );
          break;
        case SSrv.nzMessage:
          this.importParser.add('message', 'ant-design-vue');
          this.importParser.useCodeMap.set(item.name, `const ${item.name} = message;`);
          break;
        case SSrv.eventSer:
          this.importParser.add('useEventService', '@icc/hooks');
          this.importParser.useCodeMap.set(item.name, `const ${item.name} = useEventService();`);
          break;
        case SSrv.fb:
        case SSrv.ufb:
          break;
      }
    }
  }

  parseModalComponent(componentName: string, paramStr: string = "{}") {
    if (!this.ng2Vue.cfg.isParseModal) {
      return;
    }
    for (let item of this.file.imports) {
      if (
        item instanceof NamedImport &&
        item.specifiers.find((s) => s.specifier === componentName)
      ) {
        const dir = path.dirname(this.ng2Vue.vuePath);
        const vPath = path.resolve(
          dir,
          `${item.libraryName.replace(".component", ".vue")}`
        ) as string;
        if (fs.existsSync(vPath)) {
          console.log(`${componentName}已解析过`);
          return;
        }
        const ngPath = path.resolve(
          this.ng2Vue.ngFrom,
          item.libraryName.endsWith(".ts")
            ? item.libraryName
            : item.libraryName + ".ts"
        );
        if (!fs.existsSync(ngPath)) {
          return;
        }
        let root: Node = createSourceTree(`test(${paramStr})`);
        let objNode = findNodeBFS(
          root,
          (node: Node) => node.kind === SyntaxKind.ObjectLiteralExpression
        ) as ObjectLiteralExpression;
        let props = [];
        for (let prop of objNode.properties) {
          switch (prop.kind) {
            case SyntaxKind.PropertyAssignment:
              props.push(prop.name.getText());
              break;
            case SyntaxKind.ShorthandPropertyAssignment:
              props.push(prop.getText());
              break;
          }
        }
        let ng2Vue = new ComponentNg2Vue();
        if (props.length) {
          ng2Vue.exec(ngPath, vPath, { props });
        } else {
          ng2Vue.exec(ngPath, vPath);
        }
        break;
      }
    }
  }

  /**
   * 组装
   * 1. imports导入语句
   * 2. 其它chen
   */
  toTs() {
    let content = "",
      str = "";
    content = this.methodParser.generateCode();
    str = this.varParser.generateCode();
    if (str) {
      content = `${str}\n\n${content}`;
    }
    str = this.generateDeclarationCode();
    if (str) {
      content = `${str}\n\n${content}`;
    }
    str = this.importParser.generateCode();
    if (str) {
      content = `${str}\n\n${content}`;
    }
    return content.trim();
  }

  generateDeclarationCode() {
    if (this.file.declarations.length <= 1) {
      return "";
    }
    const start = this.file.imports[this.file.imports.length - 1].end;
    const end = this.classDeclarations.start;
    return this.source.slice(start + 1, end).trim();
  }
}
