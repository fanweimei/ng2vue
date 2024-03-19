import { HAttr, HEleNode } from "../../typings";
import {
  getParentFormNode,
  isTemplateName,
  transformFn,
  transformProperty,
  updateTemplateNodePos,
} from "../../util";
import { getEmitsKey, getPropsKey, isRemoveAttr } from "../const";
import * as strings from "../../../../share/strings";
import { htmlContext } from "../../context";

/**
 *
 * @param attr 转换前的属性值
 * @param anyway 是否任何属性都转换，false表示只转那些特定的
 * @returns
 */
export function commonAttrs(
  attr: HAttr,
  newAttrs: HAttr[] = [],
  anyway = true
) {
  switch (attr.key) {
    case "*ngIf":
      // *ngIf -> v-if
      newAttrs.push({
        key: "v-if",
        value: attr.value,
      });
      break;
    // 以下是不处理的属性
    case "[ngModelOptions]":
    case "acl":
      break;
    case "[acl]":
    case "acl-ability":
    case "[acl-ability]":
      newAttrs.push({
        key: "v-acl",
        value: attr.value,
      });
      break;
    case "*ngFor":
      let mainStr = attr.value?.trim(),
        indexStr = "";
      if (attr.value?.includes(";")) {
        const tmp = attr.value.split(";");
        mainStr = tmp[0].trim();
        tmp[1].trim().replace(/let\s+(.+)\s*=\s*index/, (s0, s1) => {
          indexStr = s1;
          return s0;
        });
        if (!indexStr) {
          tmp[1].trim().replace(/index\s+as\s+(.+)/, (s0, s1) => {
            indexStr = s1;
            return s0;
          });
        }
      }
      let v: string;
      if (indexStr) {
        // @ts-ignore
        v = mainStr.replace(/let\s+(.+)\s+of/, (s0, s1) => {
          return `(${s1}, ${indexStr}) in`;
        });
      } else {
        v = mainStr.replace("let ", "").replace("of", "in") as string;
      }
      newAttrs.push({
        key: "v-for",
        value: v,
      });
      break;
    case "maxlength":
      newAttrs.push({
        key: ":maxlength",
        value: attr.value,
      });
      break;
    case "minlength":
      newAttrs.push({
        key: ":minlength",
        value: attr.value,
      });
      break;
    default:
      if (anyway) {
        if (attr.key.startsWith("#")) {
          // 模板引用
          newAttrs.push({
            key: "ref",
            value: attr.key.slice(1),
          });
        } else if (attr.key.startsWith("(")) {
          // 其它方法 (focus)="fn($event)" => @focus="fn"
          let fnName = getEmitsKey(attr.key.slice(1, attr.key.length - 1))
            .replace("nzOn", "")
            .replace("nz", "");
          fnName = fnName[0].toLowerCase() + fnName.slice(1);
          newAttrs.push({
            key: `@${fnName}`,
            value: transformFn(attr.value || ""),
          });
        } else {
          // 其它属性 nzXxx => xxx
          attr.value = transformProperty(attr.value);
          let name: string = attr.key;
          // [(nzVisible)] [nzVisible]这两种形式都是变量
          attr.key.replace(/\[\(?([a-zA-Z0-9_]+)\)?\]/, (s0, s1) => {
            name = s1;
            return s0;
          });
          let isVar = name !== attr.key;
          name = getPropsKey(name);
          isVar = isVar && !name.includes(":");
          // [attr.placeholder]类似这种形式
          name = name.replace("attr.", "").replace("nz", "");
          name = name[0].toLowerCase() + name.slice(1);
          name = strings.dasherize(name);
          name = isVar ? `:${name}` : name;
          if (isVar && isTemplateName(attr.value)) {
            if (
              !updateTemplateNodePos(htmlContext.curNode, {
                key: name,
                value: attr.value,
              })
            ) {
              newAttrs.push({
                key: name,
                value: attr.value,
              });
            }
          } else {
            // 如果不是变量，但是value值是true/false/数值，对应到vue中就是变量，防止警告提示
            if (
              !isVar &&
              (attr.value === "true" ||
                attr.value === "false" ||
                !Number.isNaN(Number(attr.value)))
            ) {
              newAttrs.push({
                key: `:${name}`,
                value: attr.value,
              });
            } else {
              newAttrs.push({
                key: name,
                value: attr.value,
              });
            }
          }
        }
      }
      break;
  }
}

// 处理

// 通用
export function defaultAttrs(item: HEleNode) {
  let isChecked = false;
  // 替换属性
  let newAttrs: Array<{ key: string; value: any }> = [];
  let parentNode: HEleNode;
  for (let attr of item.attributes) {
    // 前面是form表单元素的处理
    switch (attr.key) {
      // [(ngModel)] -> v-model:value="xxx"
      case "[ngModel]":
        newAttrs.push({
          key: ":value",
          value: attr.value,
        });
        break;
      case "[(ngModel)]":
        newAttrs.push({
          key: "v-model:value",
          value: attr.value,
        });
        break;
      // formControlName="xxx" -> v-model:value="form.xxx"
      case "[formControlName]":
        parentNode = getParentFormNode(htmlContext.curformStack, item.level);
        if (parentNode) {
          let formAttr = parentNode.attributes.find((e) => e.key == ":model");
          newAttrs.push({
            key: "v-model:value",
            // value: `${pModel.value}.${attr.value}`,
            value: `${formAttr.value}[${attr.value}]`,
          });
        } else {
          newAttrs.push({
            key: "v-model:value",
            value: `xxx[${attr.value}]`,
          });
        }
        break;
      case "formControlName":
        parentNode = getParentFormNode(htmlContext.curformStack, item.level);
        if (parentNode) {
          let formAttr = parentNode.attributes.find((e) => e.key == ":model");
          newAttrs.push({
            key: "v-model:value",
            value: `${formAttr.value}.${attr.value}`,
          });
        } else {
          newAttrs.push({
            key: "v-model:value",
            value: `xxx.${attr.value}`,
          });
        }
        break;
      // (ngModelChange)="fn($event)" -> @change="fn"
      case "(ngModelChange)":
        newAttrs.push({
          key: "@change",
          value: transformFn(attr.value || ""),
        });
        break;
      // 以下是指令需要改成标签的
      // <label nz-radio nzValue="A">A</label> -> <a-radio value="A">A</label>
      case "nz-checkbox":
        isChecked = true;
        item.tagName = "a-checkbox";
        break;
      case "nz-radio":
        isChecked = true;
        item.tagName = "a-radio";
        break;
      case "nz-input":
        item.tagName = item.tagName == "input" ? "a-input" : "a-textarea";
        break;

      // 分页标签
      case "[(nzPageIndex)]":
        newAttrs.push({
          key: "v-model:current",
          value: attr.value,
        });
        break;

      // nz-upload
      case "[(nzFileList)]":
        newAttrs.push({
          key: "v-model:file-list",
          value: attr.value,
        });
        break;
      case "[remove]":
        newAttrs.push({
          key: "@remove",
          value: attr.value,
        });
        break;

      // button按钮的
      case "nz-button":
        item.tagName = "a-button";
        break;
      default:
        if (!isRemoveAttr(item, attr)) {
          commonAttrs(attr, newAttrs);
        }
        break;
    }
  }
  if (item.tagName == "nz-switch") {
    isChecked = true;
  }
  // 如果是radio 应该是v-model:checked
  if (isChecked) {
    let attr = newAttrs.find(
      (e) => e.key == "v-model:value" || e.key == ":value"
    );
    if (attr && attr.key == "v-model:value") {
      attr.key = "v-model:checked";
    }
    if (attr && attr.key == ":value") {
      attr.key = ":checked";
    }
  }
  item.attributes = newAttrs;
  return item;
}
