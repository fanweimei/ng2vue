import { parse, stringify } from "@himalaya";
import { HEleNode, HNode, HNodeType, TagType } from "./typings";
import { findNodeBFS, isSameEmptyNode } from "./util";
import { ComponentNg2Vue } from "..";
import { EMAIL_REGEXP } from "../ts/util";
import { htmlContext } from "./context";
import { directiveToElement } from "./directives";
import { processElementAttrs } from "./attributes";
import { getTagKey, needFilterTags } from "./attributes/const";
import { PropertyDeclaration } from "@typescript-parser";
import * as strings from "../../share/strings";
import { VarType } from "@ngParse/ts/typings";

export class HtmlParser {
  json: HNode[];
  parent: ComponentNg2Vue;
  // 特殊元素收集对象 标签名 --> (ref名 --> { node新对象， origin 原对象 })
  tagCollectMap: Map<
    TagType,
    Map<string, { node: HEleNode; origin?: HEleNode; [key: string]: any }>
  > = new Map();

  constructor(parent: ComponentNg2Vue) {
    this.parent = parent;
  }

  // 追踪保存tag节点
  setTagNode(
    tagName: TagType,
    varName: string,
    nodeInfo: { node: HEleNode; origin?: HEleNode; [key: string]: any }
  ) {
    if (!this.tagCollectMap.has(tagName)) {
      this.tagCollectMap.set(tagName, new Map());
    }
    const m = this.tagCollectMap.get(tagName);
    m.set(varName, nodeInfo);
  }

  getTagNode(tagName: TagType, varName: string) {
    const m = this.tagCollectMap.get(tagName);
    if (!m) {
      return null;
    }
    return m.get(varName);
  }

  init(json: HNode[]) {
    this.tagCollectMap = new Map();
    htmlContext.init(json, this);
  }

  parse(content: string) {
    this.json = parse(content);
    this.init(this.json);
    this.parseHtmlJson(this.json, 1);
    this.json = this.removeEmtpyLine(this.json);
    if (this.json.filter((n) => n.type == HNodeType.Element).length > 1) {
      const className = this.parent.tsParser.decorator.selector
        ? strings.dasherize(this.parent.tsParser.decorator.selector)
        : `g-wrapper`;
      this.json = [
        {
          type: HNodeType.Element,
          tagName: "section",
          children: [
            {
              type: HNodeType.Text,
              content: "\n",
            },
            ...this.json,
          ],
          attributes: [{ key: "class", value: className }],
        },
      ];
    }
    return this.json;
  }

  /**
   * 不处理的节点：
   * 注释阶段，直接删掉
   * 文本节点不处理
   * angular的ng-template节点（ng-template是ng-zorro组件的附带模板）
   */
  parseHtmlJson(json: Array<HNode>, level: number, pNode: HEleNode = null) {
    json.forEach((item, index) => {
      item._p = pNode;
      item.level = level;
      switch (item.type) {
        case HNodeType.Comment:
          json.splice(index, 1);
          return;
        case HNodeType.Element:
          if (this.isfilterElement(item, index, pNode, json)) {
            return;
          }
          htmlContext.setCurNode(item);
          // 对某些指令先转成元素（比如nz-col/nz-row）
          directiveToElement(item);
          // 属性处理
          processElementAttrs(item);
          // 标签名处理
          item.tagName = getTagKey(item.tagName).replace("nz", "a");
          //保存特殊节点
          this.recordSpecialNode(item);

          if (item.children?.length) {
            this.parseHtmlJson(item.children, level + 1, item);
          }
      }
    });
  }

  /**
   * （1）needFilterTags上的标签需要过滤删除
   * （2）ng-template的标签（需要排序*ngIf...else的情况）
   * @param item
   * @returns 是否需要过滤掉这个标签
   */
  isfilterElement(
    item: HEleNode,
    index: number,
    pNode: HEleNode,
    json: Array<HNode>
  ) {
    if (needFilterTags.includes(item.tagName)) {
      json.splice(index, 1);
      return true;
    }
    if (item.tagName == "ng-template") {
      // 处理这种情况 *ngIf="isGetLicense; else notGetLicense"
      let attr = item.attributes.find((e) => e.key.startsWith("#"));
      if (!attr) {
        json.splice(index, 1);
        return true;
      }
      let refName = attr.key.slice(1);
      let target = findNodeBFS(
        this.json,
        (node: HNode) =>
          node.type === HNodeType.Element &&
          !!node.attributes.find(
            (e) =>
              (e.key == "*ngIf" || e.key == "v-if") && e.value.includes(refName)
          )
      );
      if (!target) {
        json.splice(index, 1);
        return true;
      }
      const children = item.children.filter((e) => e.type == HNodeType.Element);
      if (children.length > 1) {
        item.tagName = "section";
        item.attributes = [{ key: "v-else", value: null }];
      } else {
        item = children[0] as HEleNode;
        item.attributes.push({
          key: "v-else",
          value: null,
        });
        pNode.children[index] = item;
      }
    }
    return false;
  }

  // 记录特殊的节点
  recordSpecialNode(item: HEleNode) {
    const refAttr = item.attributes.find((e) => e.key === "ref");
    let refName = refAttr?.value;
    if (item.tagName === "a-tree") {
      refName = refName || `tree${Math.random().toString(32).slice(2)}`;
      this.setTagNode(TagType.tree, refName, { node: item });
    }
  }

  // 去掉多余的换行符
  removeEmtpyLine(json: HNode[]) {
    return (json || []).reduce((prev: HNode[], cur: HNode) => {
      if (!prev.length || !isSameEmptyNode(cur, prev[prev.length - 1])) {
        prev.push(cur);
      }
      if (cur.type == HNodeType.Element && cur.children?.length) {
        cur.children = this.removeEmtpyLine(cur.children);
      }
      return prev;
    }, []);
  }

  /**
   * 根据ts解析form的结果，重新修正a-form表单元素的rules校验规则
   * 只响应式表单，通过fb.build创建的表单
   */
  checkFormRules(formName: string, ruleMap: Map<string, any[]>) {
    if (ruleMap.size == 0 || !formName) {
      return;
    }
    const target = this.tagCollectMap.get(TagType.form)?.get(formName);
    if (!target) {
      return;
    }
    const formNode = target.node;
    ruleMap.forEach((rules, key) => {
      const formItem = findNodeBFS(formNode.children, (node: HNode) => {
        if (node.type !== HNodeType.Element || node.tagName !== "a-form-item") {
          return false;
        }
        return !!node.attributes.find(
          (e) =>
            (e.key == "name" && e.value == key) ||
            (e.key == ":name" && e.value == key)
        );
      }) as HEleNode;
      if (!formItem) {
        return;
      }
      const ruleIndex = formItem.attributes.findIndex((e) => e.key == ":rules");
      let newRules: any = [];
      if (ruleIndex != -1) {
        newRules = JSON.parse(formItem.attributes[ruleIndex].value);
        formItem.attributes.splice(ruleIndex, 1);
        if (!formItem.attributes.find((e) => e.key == ":validateFirst")) {
          formItem.attributes.push({
            key: ":validateFirst",
            value: "true",
          });
        }
      }
      let controlNode: HEleNode, oldrule;
      for (let rule of rules) {
        let ruleKey = Object.keys(rule)[0];
        switch (ruleKey) {
          case "required":
            if (!newRules.find((e) => Object.keys(e).includes(ruleKey))) {
              newRules.push({
                required: rule[ruleKey],
                message: `这是必填字段`,
                whitespace: true,
              });
            }
            break;
          case "validator":
            const fn = rule.validator
              .replace(/\.bind\(.*\)/, "")
              .replace("this", "");
            newRules.push({ validator: fn });
            this.parent.collect.dealMethods(fn);
            break;
          case "max":
          case "min":
            controlNode = findNodeBFS(
              formItem.children,
              (node: HNode) =>
                node.type == HNodeType.Element &&
                !!node.attributes.find(
                  (e) => e.key.startsWith("v-model") && e.value.endsWith(key)
                )
            ) as HEleNode;
            if (
              controlNode &&
              !controlNode.attributes.find(
                (e) => e.key == ruleKey || e.key == `:${ruleKey}`
              )
            ) {
              controlNode.attributes.push({
                key: `:${ruleKey}`,
                value: rule[ruleKey],
              });
            }
            break;
          case "pattern":
            oldrule = newRules.find((e) => Object.keys(e).includes("pattern"));
            if (!oldrule) {
              let requireRule = newRules.find((e) =>
                Object.keys(e).includes("required")
              );
              newRules.push({
                pattern: "/" + rule.pattern.replace(`"`, ``) + "/g",
                message: requireRule
                  ? requireRule.message
                  : rule.pattern == EMAIL_REGEXP
                  ? `输入的值不符合邮箱格式`
                  : "输入的值格式不匹配",
              });
            } else {
              oldrule.pattern = "/" + rule.pattern.replace(`"`, ``) + "/g";
            }
            break;
          case "minLength":
            let m = ruleKey.slice(0, 3);
            oldrule = newRules.find((e) => Object.keys(e).includes(m));
            if (!oldrule) {
              if (parseInt(rule[ruleKey]) > 1) {
                newRules.push({
                  [m]: rule[ruleKey],
                  message: `输入的值不能${m == "min" ? "少于" : "多于"}${
                    rule[ruleKey]
                  }个字符`,
                });
              }
            } else {
              oldrule[m] = rule[ruleKey];
            }
            break;
        }
      }
      if (newRules.length) {
        formItem.attributes.push({
          key: ":rules",
          value: JSON.stringify(newRules),
        });
      }
    });
  }

  // 同步ref变量名
  syncRefName(node: HEleNode, refVars: PropertyDeclaration[]) {
    let attr = node.attributes.find((e) => e.key == "ref");
    if (attr) {
      let v = refVars.find(
        (e) => e.viewChild == attr.value || e.viewChildren == attr.value
      );
      if (v && (v.viewChild != v.name || v.viewChildren != v.name)) {
        attr.value = v.name;
      } else if (!v && node.tagName == "a-form") {
        this.parent.tsParser.varParser.varMap.set(attr.value, {
          varType: VarType.ref,
          type: "FormInstance",
          name: attr.value,
          isOptional: false,
          isStatic: false,
        });
        this.parent.tsParser.importParser.add("FormInstance", "ant-design-vue");
      }
    }
  }

  // 同步imports icon导入引用
  syncIconImports(node: HEleNode) {
    if (
      node.tagName.endsWith("-filled") ||
      node.tagName.endsWith("-two-tone") ||
      node.tagName.endsWith("-outlined")
    ) {
      this.parent.tsParser.importParser.add(
        strings.classify(node.tagName),
        "@ant-design/icons-vue"
      );
    }
  }

  // 删掉表单上的disabled属性
  deleteFormDisabledAttr(node: HEleNode) {
    let formMap = this.tagCollectMap.get(TagType.form);
    if (!formMap) {
      return;
    }
    if (node.tagName !== "icc-button" && node.tagName !== "a-button") {
      return;
    }
    let disableAttr = node.attributes.find(
      (e) => e.key == ":disabled" || e.key == ":is-disabled"
    );
    if (!disableAttr) {
      return;
    }
    const formName = disableAttr.value.replace("!", "").split(".")[0];
    if (!formMap.has(formName)) {
      return;
    }
    node.attributes = node.attributes.filter(
      (e) => e.key !== ":disabled" && e.key !== ":is-disabled"
    );
  }

  collectVarsInHtml(item: HNode) {
    switch (item.type) {
      case HNodeType.Text:
        if (item.content.includes("{{")) {
          item.content.replace(/\{\{(.+)\}\}/, (s0, s1) => {
            this.parent.collect.dealExpression(s1);
            return s0;
          });
        }
        break;
      case HNodeType.Element:
        for (let attr of item.attributes) {
          if (attr.key == "v-if") {
            // 处理 *ngIf="tipStr == '';else elseTemplate"
            const elseReg = /;\s*else/;
            if (elseReg.test(attr.value)) {
              let temp = attr.value.split(elseReg);
              attr.value = temp[0].trim();
            }
            this.parent.collect.dealExpression(attr.value);
          } else if (attr.key == "v-for") {
            this.parent.collect.useInHtmlVars.add(
              attr.value.split("in")[1].trim()
            );
          } else if (attr.key.includes("v-model")) {
            this.parent.collect.dealExpression(attr.value);
          } else if (attr.key.startsWith(":")) {
            this.parent.collect.dealBindValue(attr.value);
          } else if (attr.key.startsWith("@")) {
            this.parent.collect.dealMethods(attr.value);
          }
        }
        break;
    }
  }

  // a-tree树形矫正
  checkTree() {
    const treeNodeMap = this.tagCollectMap.get(TagType.tree);
    if (!treeNodeMap || !treeNodeMap.size) {
      return;
    }
    const updateNodeTitle = (nodes: HNode[]) => {
      for (let item of nodes) {
        if (item.type === HNodeType.Text) {
          item.content = item.content.replace(".origin", "");
        } else if (item.type === HNodeType.Element && item.children?.length) {
          updateNodeTitle(item.children);
        }
      }
    };
    treeNodeMap.forEach((item) => {
      // (1)#title --> #title="node"  (2)把.origin删掉
      let templateNode = item.node.children.find(
        (item) => item.type === HNodeType.Element && item.tagName === "template"
      );
      if (!templateNode) {
        return;
      }
      const titleAttr = (templateNode as HEleNode).attributes.find(
        (e) => e.key === "#title"
      );
      if (titleAttr) {
        titleAttr.value = "node";
        updateNodeTitle((templateNode as HEleNode).children);
      }
    });
  }

  // 收集数据And 同步Ts
  collectAndSyncTs() {
    const vars = this.parent.tsParser.properties.filter(
      (v) => v.viewChild || v.viewChildren
    );
    const visit = (nodes: HNode[]) => {
      if (!nodes?.length) {
        return;
      }
      for (let item of nodes) {
        this.collectVarsInHtml(item);
        if (item.type === HNodeType.Element) {
          this.syncRefName(item, vars);
          this.syncIconImports(item);
          this.deleteFormDisabledAttr(item);

          visit(item.children);
        }
      }
    };
    visit(this.json);
    this.checkTree();
  }

  toHtml() {
    return stringify(this.json);
  }
}
