import * as fs from "fs";
import * as path from "path";
import { Collect } from "./collect";
import { HtmlParser } from "./html";
import { TsParser } from "./ts";
import { getValidNgPath, getValidVuePath } from "../share/path";
import { HEleNode, HNodeType } from "./html/typings";

export class ComponentNg2Vue {
  // 目录名
  ngFrom: string;
  fileName: string;
  vuePath: string;
  // style转换后的模板
  styleTemplate: string = "";
  // ts解析器对象
  tsParser: TsParser;
  // html解析对象
  htmlParser: HtmlParser;
  // 收集器
  collect: Collect;
  /**
   * 处理一些特殊情况
   * (1) props，需要传入props变量数组，比如弹窗组件，没有写@Input，但是转到Vue里面又是props变量
   */
  cfg: { props?: Array<string>; isParseModal: boolean } = {
    isParseModal: true,
  };

  constructor() {
    this.collect = new Collect(this);
    this.htmlParser = new HtmlParser(this);
    this.tsParser = new TsParser(this);
  }

  /**
   *
   * @param ngPath angular组件的路径
   * @param vuePath vue组件存放路径
   * @param cfg 特殊配置，比如弹窗组件需要将一些参数定义到vue中的props
   * @returns
   */
  async exec(
    ngPath: string,
    vuePath: string,
    cfg?: { props?: Array<string>; isParseModal?: boolean }
  ) {
    this.cfg = {
      isParseModal: true,
      ...(cfg || {}),
    };
    this.collect.init();
    const pathInfo = getValidNgPath(ngPath);
    this.fileName = pathInfo.fileName;
    this.ngFrom = pathInfo.ngFrom;
    this.vuePath = getValidVuePath(vuePath);

    const content = await this.parse();
    if (typeof content === "string") {
      return content;
    }
    await this.toTemplate();

    return content;
  }

  async parse() {
    const tsPath = path.resolve(this.ngFrom, this.fileName) as string;
    if (!fs.existsSync(tsPath)) {
      console.error(`${tsPath} 路径不存在`);
      return `${tsPath} 路径不存在`;
    }
    const content = fs.readFileSync(tsPath, { encoding: "utf-8" });
    // 先读取ts文件生成File对象
    await this.tsParser.readToFile(content);

    // 解析html
    await this.parseHtml();
    // 从html中收集变量并且做一些同步工作
    this.htmlParser.collectAndSyncTs();
    // 解析ts
    await this.tsParser.parse();

    // 解析less，放最后，因为要使用到html最外层类名
    await this.parseLess();

    return this.tsParser.file;
  }

  async parseLess() {
    let className =
      (
        this.htmlParser.json.find(
          (e) => e.type == HNodeType.Element
        ) as HEleNode
      ).attributes.find((e) => e.key == "class")?.value || "";
    if (className) {
      className = className.split(" ")[0];
      className = `.${className} `;
    }
    const transLess = (content: string) => {
      return content
        .replace(/:host\s*/gi, "*")
        .replace(/::ng-deep/gi, `${className}:deep(*)`)
        .replace(/:host\s+::ng-deep/gi, `${className}:deep(*)`)
        .replace(/@import(.+);/, "")
        .replace(/\/assets\//g, "@icc/assets/");
    };

    const decorator = this.tsParser.decorator;
    if (decorator.stylesUrl) {
      decorator.stylesUrl.forEach((fileName) => {
        let lessPath = path.resolve(this.ngFrom, fileName) as string;
        if (fs.existsSync(lessPath)) {
          const styleContent = fs.readFileSync(lessPath, {
            encoding: "utf-8",
          });
          this.styleTemplate += transLess(styleContent) + "\n";
        }
      });
    }
    if (decorator.styles) {
      decorator.styles.forEach((styleStr) => {
        this.styleTemplate += transLess(styleStr) + "\n";
      });
    }
    return this.styleTemplate.trim();
  }

  async parseHtml() {
    const decorator = this.tsParser.decorator;
    if (decorator.templateUrl) {
      const htmlPath = path.resolve(
        this.ngFrom,
        decorator.templateUrl
      ) as string;
      if (fs.existsSync(htmlPath)) {
        const htmlContent = fs.readFileSync(htmlPath, { encoding: "utf-8" });
        await this.htmlParser.parse(htmlContent);
      }
    }
    if (decorator.template) {
      await this.htmlParser.parse(decorator.template.trim());
    }
  }

  toTemplate() {
    let content = "";
    let html = this.htmlParser.toHtml();
    if (html) {
      content = "<template>\n" + html + "\n</template>\n";
    }
    const tsContent = this.tsParser.toTs();
    if (tsContent) {
      content += `<script lang="ts" setup>\n${tsContent}\n</script>\n`;
    }
    let style = this.styleTemplate.trim();
    if (style) {
      content += `<style lang="less" scoped>\n${style}\n</style>`;
    }
    fs.writeFileSync(this.vuePath, content);
  }
}
