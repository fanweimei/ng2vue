import { htmlContext } from "../../context";
import { HEleNode, TagType } from "../../typings";
import { defaultAttrs } from "./default";
import { createSourceTree, findNodeBFS } from "../../../ts/util";
import { CallExpression, Node, SyntaxKind } from "typescript";

/**
 * 处理表单页面的保存按钮（button/icc-button)，
 * （1）置灰状态如果是form.invalid/valid去掉
 * （2）点击事件如果有form.value参数去掉.value
 */

function filterFormDisabled(disabledKey: string, item: HEleNode) {
  let disabledAttr = item.attributes.find((e) => e.key === `[${disabledKey}]`);
  if (!disabledAttr) {
    return;
  }
  const tmp = disabledAttr.value.split(".");
  if (
    tmp.length < 2 ||
    (tmp[tmp.length - 1] != "invalid" && tmp[tmp.length - 1] != "valid")
  ) {
    return;
  }
  const formName = tmp[0].replace("!", "").replace("!!", "");
  item.attributes = item.attributes.filter((e) => e.key !== "[isDisabled]");
  const formInfo = htmlContext.htmlParser.getTagNode(TagType.form, formName);
  if (!formInfo || !formInfo.node) {
    return;
  }
  if (formInfo.node.attributes.find((e) => e.key == "ref")) {
    return formInfo;
  }
  formInfo.node.attributes.push({
    key: "ref",
    value: `${formName}Ref`,
  });
  return formInfo;
}

function transClickFn(clickKey: string, item: HEleNode, formInfo) {
  let clickAttr = item.attributes.find((e) => e.key === `(${clickKey})`);
  if (!clickAttr) {
    return;
  }
  const root = createSourceTree(clickAttr.value);
  const callNode = findNodeBFS(
    root,
    (node: Node) => node.kind === SyntaxKind.CallExpression
  );
  if (!callNode) {
    return;
  }
  let saveFnName = (callNode as CallExpression).expression.getText();
  if (formInfo) {
    formInfo["submitFnName"] = saveFnName;
  }
  let oldParamStr = "",
    newParamStr = "";
  if (formInfo) {
    let modelName = formInfo.node.attributes.find(
      (e) => e.key == ":model"
    )?.value;
    oldParamStr = `${modelName}.value`;
    newParamStr = modelName;
  } else {
    for (let arg of (callNode as CallExpression).arguments) {
      if (oldParamStr) {
        break;
      }
      let txt = arg.getText();
      if (!txt.endsWith(".value")) {
        continue;
      }
      let formName = txt.replace(".value", "");
      const formInfo = htmlContext.htmlParser.getTagNode(
        TagType.form,
        formName
      );
      if (!formInfo || !formInfo.node) {
        continue;
      }
      oldParamStr = txt;
      newParamStr = formName;
      formInfo["submitFnName"] = saveFnName;
      if (formInfo.node.attributes.find((e) => e.key == "ref")) {
        continue;
      }
      formInfo.node.attributes.push({
        key: "ref",
        value: `${formName}Ref`,
      });
    }
  }
  clickAttr.value = clickAttr.value.replace(oldParamStr, newParamStr);
}

export function buttonAttrs(
  item: HEleNode,
  disabledKey = "disabled",
  clickKey = "click"
) {
  const formInfo = filterFormDisabled(disabledKey, item);
  transClickFn(clickKey, item, formInfo);
  defaultAttrs(item);
}

export function iccButtonAttrs(item: HEleNode) {
  buttonAttrs(item, "isDisabled", "btnClick");
}
