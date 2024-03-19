import { HAttr, HEleNode, HNodeType } from "../../typings";
import { isCusComponent } from "../../util";
import { directiveElesAttrsMap } from "../const";

// isWrapperEle是否是一个包裹元素，包裹元素必须往上提一层，生成新的一个标签
export function defaultDirective(
  item: HEleNode,
  attr: HAttr,
  isWrapperEle = false
) {
  // 不是antd组件或者icc业务组件，让这个组件变成栅格布局的元素
  item.attributes = item.attributes.filter((e) => e.key != attr.key);
  if (!isCusComponent(item.tagName) && !isWrapperEle) {
    item.tagName = attr.key;
    return;
  }
  let tempAttrs = [...directiveElesAttrsMap[attr.key]];
  // nz-tooltip/nz-dropdown不会在页面中真的形成元素，仅仅只是一个包裹元素，common属性不能提取到nz-tooltip
  if (!isWrapperEle) {
    tempAttrs = tempAttrs.concat([...directiveElesAttrsMap.common]);
  }
  // 如果是antd组件或者icc组件，伪造一个父元素节点
  let newNode: HEleNode = {
    type: HNodeType.Element,
    children: item.children,
    attributes: item.attributes.filter(
      (attr) =>
        !tempAttrs.find(
          (e) => attr.key == e || attr.key == `[${e}]` || attr.key == `(${e})`
        )
    ),
    tagName: item.tagName,
  };
  item.children = [
    {
      type: HNodeType.Text,
      content: "\r\n",
    },
    newNode,
    {
      type: HNodeType.Text,
      content: "\r\n",
    },
  ];
  item.tagName = attr.key;
  item.attributes = item.attributes.filter((attr) =>
    tempAttrs.find((e) => attr.key == e || attr.key == `[${e}]`)
  );
  return item;
}
