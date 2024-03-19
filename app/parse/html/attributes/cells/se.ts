import { HAttr, HEleNode, HNode, HNodeType } from "../../typings";
import { strToObj } from "../../util";
import { commonAttrs } from "./default";

// 获取se下的表单控件元素
function getSeControlNode(json: Array<HNode>) {
  let node: HEleNode | null = null;
  // 用广度遍历获取控件节点(绑定了formControlName 或者[(ngModel)])的节点
  const stack: Array<HNode> = [...json];
  while (!!stack.length) {
    let item: HNode = stack.pop() as HNode;
    if (item.type == HNodeType.Element) {
      if (
        item.attributes.find(
          (e) => e.key == "formControlName" || e.key == "[(ngModel)]"
        )
      ) {
        node = item;
        break;
      }
      if (item.children) {
        stack.push(...item.children);
      }
    }
  }
  return node;
}

// 组合a-form-item的rules规则  这里比较复杂，从子级中找
function combFormItemRules(se: HEleNode, controlNode: HEleNode | null = null) {
  let errorIndex = se.attributes.findIndex(
    (e) => e.key == "error" || e.key == "[error]"
  );
  if (errorIndex == -1) {
    return [];
  }
  let errorItem: HAttr;
  errorItem = se.attributes.splice(errorIndex, 1)[0];
  const hasRequired = se.attributes.find(
    (e) => e.key == "required" || e.key == "[required]"
  );
  if (errorItem.key == "error" && hasRequired) {
    return [
      {
        required: true,
        message: errorItem.value,
        whitespace: true,
      },
    ];
  }
  if (errorItem.key == "[error]") {
    // 将字符串转成json
    const errorObj = strToObj(errorItem.value);
    if (typeof errorObj == "string" && hasRequired) {
      // 字符串形式
      if (errorObj.startsWith("'")) {
        return [
          {
            required: true,
            message: errorItem.value?.slice(1, -1),
            whitespace: true,
          },
        ];
      } else {
        // 变量形式
        return [
          {
            required: true,
            message: errorItem.value?.includes("$any")
              ? errorItem.value?.replace("$any(", "").replace(")", "")
              : errorItem.value,
            whitespace: true,
          },
        ];
      }
    }
    const rules: any[] = [];
    if (hasRequired && errorObj.required) {
      rules.push({
        required: true,
        message: errorItem.value?.slice(1, -1),
        whitespace: true,
      });
      delete errorObj.required;
    }
    if (!controlNode) {
      return rules;
    }
    for (let attr of controlNode.attributes) {
      let key = attr.key.replace("[", "").replace("]", "");
      switch (key) {
        case "maxlength":
        case "maxLength":
          if (errorObj[key]) {
            rules.push({
              max: +(attr.value || 0) || 0,
              message: errorObj[key],
            });
          }
          delete errorObj[key];
          break;
        case "minlength":
        case "minLength":
          if (errorObj[key]) {
            rules.push({
              min: +(attr.value || 0) || 0,
              message: errorObj[key],
            });
          }
          delete errorObj[key];
          break;
        case "pattern":
          if (errorObj[key]) {
            rules.push({
              pattern: attr.value,
              message: errorObj[key],
            });
          }
          delete errorObj[key];
          break;
      }
    }
    for (let key in errorObj) {
      rules.push({ validator: key });
    }
    return rules;
  }
}

// 获取form-item的name值
function getFormItemName(controlNode: HEleNode | null = null) {
  if (!controlNode) {
    return "";
  }
  const attr = controlNode.attributes.find(
    (e) => e.key == "formControlName" || e.key == "[(ngModel)]"
  );
  if (!attr) {
    return "";
  }
  if (attr.key == "formControlName") {
    return attr.value;
  }
  // ngModel的话，可能是form.name这种形式
  if (attr.key == "[(ngModel)]") {
    if (!attr.value?.includes(".")) {
      return attr.value;
    }
    return attr.value.split(".").slice(1);
  }
}

/**
 * se
 * 容易出错的地方：error
 */
export function seAttrs(item: HEleNode) {
  // se --> a-form-item
  let newAttrs: Array<HAttr> = [];
  const controlNode = getSeControlNode(item.children);
  // 获取规则
  const rules = combFormItemRules(item, controlNode);
  //获取名字
  const name = getFormItemName(controlNode);
  // a-form-item需要name 和rules
  if (name) {
    newAttrs.push({
      key: "name",
      value: name as string,
    });
  }
  if (rules?.length) {
    newAttrs.push({
      key: ":rules",
      value: JSON.stringify(rules),
    });
    newAttrs.push({
      key: ":validateFirst",
      value: "true",
    });
  }

  for (let attr of item.attributes) {
    if (attr.key.includes("labelWidth")) {
      newAttrs.push({
        key: ":label-col",
        value: `{ span: ${Math.ceil(+(attr.value || 0) / 40)} }`,
      });
    } else {
      commonAttrs(attr, newAttrs);
    }
  }
  item.attributes = newAttrs;
}
