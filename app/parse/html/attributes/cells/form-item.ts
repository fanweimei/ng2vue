import { htmlContext } from "../../context";
import { directiveElesAttrsMap } from "../../directives/const";
import { HAttr, HEleNode, HNode, HNodeType, HTextNode } from "../../typings";
import {
  findNodeBFS,
  findNodeDFS,
  getParentFormNode,
  isEmptyStr,
  removeSpaces,
} from "../../util";
import { commonAttrs } from "./default";

// 获取栅格属性
function setNzColAttr(attr: HAttr, gridCol: Object) {
  if (!directiveElesAttrsMap["nz-col"].find((e) => attr.key.includes(e))) {
    return;
  }
  let v: string | number;
  // 是否是变量
  if (!attr.key.startsWith("[")) {
    v = parseInt(attr.value as string) || 0;
  } else {
    v = parseInt(attr.value as string)
      ? parseInt(attr.value as string)
      : (attr.value as string);
  }
  let k = attr.key
    .replace("[", "")
    .replace("]", "")
    .replace("nz", "")
    .toLowerCase();
  gridCol[k] = v;
}

// 从nz-form-label中获取属性
function getAttrsFromFormLabel(item: HEleNode): HAttr[] {
  let labelNode = item.children.find(
    (e) => e.type == HNodeType.Element && e.tagName == "nz-form-label"
  ) as HEleNode;
  if (!labelNode) {
    return [];
  }
  let attrs: HAttr[] = [],
    labelCol: { [key: string]: string | number } = {};
  for (let attr of labelNode.attributes) {
    let isVar = attr.key.startsWith("[");
    let key = isVar ? attr.key.replace("[", "").replace("]", "") : attr.key;
    switch (key) {
      case "nzRequired":
        attrs.push({ key: `${isVar ? ":" : ""}required`, value: attr.value });
        break;
      case "nzFor":
        attrs.push({ key: `${isVar ? ":" : ""}html-for`, value: attr.value });
        break;
      case "nzTooltipTitle":
        attrs.push({ key: `${isVar ? ":" : ""}help`, value: attr.value });
        break;
      case "nzNoColon":
        attrs.push({
          key: `${isVar ? ":" : ""}colon`,
          value: attr.value == "true" ? "false" : "true",
        });
        break;
      default:
        setNzColAttr(attr, labelCol);
        break;
    }
  }
  // 是否有label-col的属性
  if (Object.keys(labelCol).length) {
    attrs.push({
      key: ":label-col",
      value: JSON.stringify(labelCol),
    });
  }

  let textNode = findNodeDFS(
    labelNode,
    (node: HNode) => node.type === HNodeType.Text && !isEmptyStr(node.content)
  ) as HTextNode;
  if (textNode) {
    let text = removeSpaces(textNode.content);
    text = text.replace("\n", "").trim();
    if (!text.startsWith("{{")) {
      attrs.push({ key: "label", value: text });
    } else {
      attrs.push({
        key: ":label",
        value: text.replace("{{", "").replace("}}", "").trim(),
      });
    }
  }
  return attrs;
}

// 获取rule规则属性
function getFormControlRules(errorAttr: HAttr, formNode: HEleNode) {
  const rules: any[] = [];
  if (!errorAttr.key.startsWith("[")) {
    rules.push({ required: true, message: errorAttr.value, whitespace: true });
    return rules;
  }
  // 找到错误提示节点
  const tmplNode = findNodeBFS(formNode.children, (node: HNode) => {
    if (node.type == HNodeType.Element && node.tagName == "ng-template") {
      return !!node.attributes.find((e) => (e.key = `#${errorAttr.value}`));
    }
    return false;
  });
  if (
    !tmplNode ||
    tmplNode.type !== HNodeType.Element ||
    !tmplNode.children?.length
  ) {
    return [];
  }
  for (let n of tmplNode.children) {
    if (n.type !== HNodeType.Element) {
      continue;
    }
    let attr = n.attributes.find((e) => e.key == "*ngIf");
    if (!attr) {
      continue;
    }
    let key = "";
    attr.value?.replace(/\.hasError\('(.*)'\)/, (s0, s1) => {
      key = s1;
      return s0;
    });
    if (!key) {
      continue;
    }
    let textNode = n.children.find(
      (e) => e.type == HNodeType.Text
    ) as HTextNode;
    let message = textNode.content.replace("\n", "").trim();
    switch (key) {
      case "required":
        rules.push({ required: true, message, whitespace: true });
        break;
      // case "maxlength":
      // case "maxLength":
      // case "max":
      //   rules.push({ max: "xxx", message });
      //   break;
      case "minlength":
      case "minLength":
      case "min":
        rules.push({ min: "xxx", message });
        break;
      case "pattern":
        rules.push({ pattern: "xxx", message });
        break;
      case "unique":
      case "duplicated":
        rules.push({ validator: "uniqueNameValidator" });
        break;
      default:
        // rules.push({ validator: key });
        break;
    }
  }
  return rules;
}

// 从nz-form-control获取属性
function getAttrsFromFormControl(item: HEleNode): HAttr[] {
  const controlNode = item.children.find(
    (e) => e.type == HNodeType.Element && e.tagName == "nz-form-control"
  ) as HEleNode;
  if (!controlNode) {
    return [];
  }
  const attrs: HAttr[] = [],
    wrapperCol: { [key: string]: string | number } = {};
  let rules: any = [];
  for (let attr of controlNode.attributes) {
    let isVar = attr.key.startsWith("[");
    let key = isVar ? attr.key.replace("[", "").replace("]", "") : attr.key;
    switch (key) {
      case "nzValidateStatus":
        attrs.push({
          key: `${isVar ? ":" : ""}validate-status`,
          value: attr.value,
        });
        break;
      case "nzHasFeedback":
        attrs.push({
          key: `${isVar ? ":" : ""}has-feedback`,
          value: attr.value,
        });
        break;
      case "nzExtra":
        attrs.push({ key: `${isVar ? ":" : ""}extra`, value: attr.value });
        break;
      case "nzErrorTip":
        rules = getFormControlRules(attr, item);
        break;
      default:
        setNzColAttr(attr, wrapperCol);
        break;
    }
  }
  // 是否有label-col的属性
  if (Object.keys(wrapperCol).length) {
    attrs.push({
      key: ":wrapper-col",
      value: JSON.stringify(wrapperCol),
    });
  }
  if (rules.length) {
    attrs.push({
      key: ":rules",
      value: JSON.stringify(rules),
    });
  }
  // nz-form-control的子节点移到nz-form-item中
  item.children = controlNode.children;
  return attrs;
}

// nz-form-item --> a-form-item
export function nzFormItemAttrs(item: HEleNode) {
  // 先判断是否有栅格布局
  let newAttrs: Array<HAttr> = [];
  for (let attr of item.attributes) {
    commonAttrs(attr, newAttrs);
  }
  newAttrs = newAttrs.concat(getAttrsFromFormLabel(item));
  newAttrs = newAttrs.concat(getAttrsFromFormControl(item));
  const inputNode = findNodeBFS(item.children, (node: HNode) => {
    if (node.type == HNodeType.Element) {
      return !!node.attributes.find(
        (e) => e.key == "formControlName" || e.key == "[(ngModel)]"
      );
    }
    return false;
  }) as HEleNode;
  if (inputNode) {
    const parentNode = getParentFormNode(htmlContext.curformStack, item.level);
    const hasModel =
      parentNode && parentNode.attributes.find((e) => e.key == ":model");
    let attr = inputNode.attributes.find(
      (e) => e.key == "formControlName" || e.key == "[(ngModel)]"
    );
    if (attr?.key == "formControlName") {
      if (hasModel) {
        newAttrs.push({ key: "name", value: attr.value });
      }
    } else {
      if (hasModel) {
        let name = attr?.value.includes(".")
          ? attr.value.split(".").slice(1)
          : [attr?.value];
        newAttrs.push({
          key: "name",
          value: name[name.length - 1],
        });
      }
      // 模板表单，需要补全校验规则
      let ruleAttr = newAttrs.find((e) => e.key == ":rules");
      if (ruleAttr) {
        let rulesArr = JSON.parse(ruleAttr.value);
        for (let r of rulesArr) {
          if (r.pattern) {
            let tmp = inputNode.attributes.find((e) => e.key == "pattern");
            r.pattern = tmp ? tmp.value : r.pattern;
          } else if (r.max) {
            let tmp = inputNode.attributes.find(
              (e) =>
                e.key == "max" || e.key == "maxLength" || e.key == "maxlength"
            );
            r.max = tmp ? tmp.value : r.max;
          } else if (r.min) {
            let tmp = inputNode.attributes.find(
              (e) =>
                e.key == "min" || e.key == "minLength" || e.key == "minlength"
            );
            r.min = tmp ? tmp.value : r.min;
          } else if (r.validator && r.validator == "uniqueNameValidator") {
            let tmp = inputNode.attributes.find((e) => e.key == "req");
            r.validator = tmp ? `uniqueNameValidator(${tmp.value})` : '';
          }
        }
      }
    }
  }
  if (newAttrs.find((e) => e.key == ":rules")) {
    newAttrs.push({
      key: ":validateFirst",
      value: "true",
    });
  }
  item.attributes = newAttrs;
}
