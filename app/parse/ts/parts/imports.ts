import { ComponentNg2Vue } from "../../index";
import { TsParser } from "..";
import { Import, NamedImport, SymbolSpecifier } from "@typescript-parser";
import * as strings from "../../../share/strings";

export class TsParserImports {
  imMap: Map<string, Import> = new Map();
  useCodeMap: Map<string, string> = new Map();
  discardTypes: Map<string, string> = new Map();
  constructor(public tsParser: TsParser, public ng2Vue: ComponentNg2Vue) {}

  add(specifier: string, libraryName: string) {
    if (!this.imMap.get(libraryName)) {
      this.imMap.set(libraryName, new NamedImport(libraryName));
    }
    let item = this.imMap.get(libraryName) as NamedImport;
    if (!item.specifiers.find((e) => e.specifier == specifier)) {
      item.specifiers.push(new SymbolSpecifier(specifier));
    }
  }

  addSpecifiers(
    specifiers: SymbolSpecifier[] | SymbolSpecifier,
    libraryName: string
  ) {
    if (specifiers && !Array.isArray(specifiers)) {
      specifiers = [specifiers];
    }
    if (!(specifiers as SymbolSpecifier[]).length) {
      return;
    }
    if (!this.imMap.get(libraryName)) {
      this.imMap.set(libraryName, new NamedImport(libraryName));
    }
    let item = this.imMap.get(libraryName) as NamedImport;
    for (let s of specifiers as SymbolSpecifier[]) {
      if (!item.specifiers.find((e) => e.specifier == s.specifier)) {
        item.specifiers.push(s);
      }
    }
  }

  // 解析
  parse() {
    for (let item of this.tsParser.file.imports) {
      if (item.libraryName == "@delon/util" && item instanceof NamedImport) {
        for (let s of item.specifiers) {
          switch (s.specifier) {
            case "deepCopy":
              this.add("cloneDeep", "lodash");
              this.discardTypes.set("deepCopy", "cloneDeep");
              break;
          }
        }
        continue;
      }
      if (
        item.libraryName.startsWith("@angular") ||
        item.libraryName.startsWith("@delon") ||
        item.libraryName.startsWith("ng-zorro-antd")
      ) {
        if (item instanceof NamedImport) {
          item.specifiers.forEach((e) => {
            this.discardTypes.set(e.specifier, "any");
          });
        }
        continue;
      }
      if (item.libraryName == "@icc/common-lib") {
        if (item instanceof NamedImport) {
          let utils = [],
            msg = [];
          for (let s of item.specifiers) {
            if (s.specifier.endsWith("Component")) {
              let libraryName = `@icc/components/${strings.dasherize(s.specifier.replace('Component', ''))}`;
              let nameImport = new NamedImport(libraryName);
              nameImport.defaultAlias = s.specifier;
              this.imMap.set(libraryName, nameImport);
            } else if (s.specifier.endsWith("HelperImpl")) {
              msg.push(s);
            } else if (!s.specifier.endsWith("Service")) {
              utils.push(s);
            }
          }
          this.addSpecifiers(utils, "@icc/utils");
          this.addSpecifiers(msg, "@icc/msg");
        }
        continue;
      }
      if (
        item.libraryName.startsWith("@share") &&
        item instanceof NamedImport
      ) {
        this.addSpecifiers(
          item.specifiers.filter((e) => e.specifier == "URLS"),
          "@/api/interface"
        );
        this.addSpecifiers(
          item.specifiers.filter((e) => e.specifier !== "URLS"),
          "@icc/utils"
        );
        continue;
      }
      if (item.libraryName.endsWith(".component")) {
        item.libraryName = item.libraryName.replace(".component", ".vue");
        if (item instanceof NamedImport && item.specifiers.length == 1) {
          item.defaultAlias = item.specifiers[0].specifier.replace(
            "Component",
            ""
          );
          this.discardTypes.set(
            item.specifiers[0].specifier,
            item.defaultAlias
          );
          item.specifiers = [];
          this.imMap.set(item.libraryName, item);
          continue;
        }
      }
      if (item instanceof NamedImport) {
        this.addSpecifiers((item as NamedImport).specifiers, item.libraryName);
      } else {
        this.imMap.set(item.libraryName, item);
      }
    }
  }

  // 生成代码
  generateCode() {
    let content = "";
    let temp = [];
    this.imMap.forEach((item: Import) => {
      if (
        item.libraryName.startsWith("./") ||
        item.libraryName.startsWith("../")
      ) {
        temp.push(item);
      } else {
        temp.unshift(item);
      }
    });
    for (let item of temp) {
      content += this.tsParser.codeGenerator.generate(item) + "\n";
    }
    let useContent = "";
    this.useCodeMap.forEach((str: string) => {
      useContent += `${str}\n`;
    });
    if (useContent.trim()) {
      content += `\n${useContent}`;
    }
    return content.trim();
  }

  // 过滤废弃的类型，改成any
  filterDiscardtypeContent(content: string) {
    let str = content;
    this.discardTypes.forEach((v, k) => {
      str = str.replace(new RegExp(`\\b${k}\\b`, "g"), v); // 不能识别的类型都转为any
    });
    return str;
  }
}
