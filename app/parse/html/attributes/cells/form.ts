import { htmlContext } from "../../context";
import { HEleNode, TagType } from "../../typings";
import { commonAttrs } from "./default";

// form表单元素属性替换
export function formAttrs(item: HEleNode) {
  // 替换属性
  let newAttrs: Array<{ key: string; value: any }> = [];
  for (let attr of item.attributes) {
    switch (true) {
      case attr.key == "[formGroup]":
        newAttrs.push({
          key: ":model",
          value: attr.value,
        });
        // 记录form对象，后面的input表单控件会使用/ts修改rules也会使用到
        htmlContext.curformStack.push(item);
        htmlContext.htmlParser.setTagNode(TagType.form, attr.value, {
          node: item,
        });
        break;
      case attr.key.includes("labelWidth"):
        newAttrs.push({
          key: ":label-col",
          value: `{ span: ${Math.ceil(+(attr.value || 0) / 40)} }`,
        });
        break;
      case attr.key == "se-container":
      case attr.key == "nz-form":
        break;
      default:
        // 别的属性不转
        commonAttrs(attr, newAttrs);
        break;
    }
  }
  item.attributes = newAttrs;
  item.tagName = "a-form";
  return item;
}

// 给form表单元素添加
export function addFormRef(name: string) {
  if (!htmlContext.htmlParser.tagCollectMap.get(TagType.form)?.has(name)) {
    return;
  }
  let formNode = htmlContext.htmlParser.tagCollectMap
    .get(TagType.form)
    .get(name).node;
  if (!formNode) {
    return `${name}Ref`;
  }
  let attr = formNode.attributes.find((e) => e.key == "ref");
  if (attr) {
    return attr.value;
  }
  formNode.attributes.push({
    key: "ref",
    value: `${name}Ref`,
  });
  return `${name}Ref`;
}
