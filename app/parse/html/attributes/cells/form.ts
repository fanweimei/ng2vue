import { getNum, isEmptyStr } from "@ngParse/html/util";
import { htmlContext } from "../../context";
import { HAttr, HEleNode, HNode, HNodeType, HTextNode, TagType } from "../../typings";
import { isRemoveAttr } from "../const";
import { commonAttrs } from "./default";

/**
 * 栅格布局处理
 * 对应se-container和se元素的col
 * 
 */
function dealSeContainer(item: HEleNode) {
  let count = 1;
  const containerAttr = item.attributes.find(e => e.key == 'se-container');
  if (containerAttr) {
    count = getNum(containerAttr.value, 1);
  }
  const hasSe = item.children.find(e => e.type === HNodeType.Element && e.tagName == 'se');
  // 1. 没有设置se-container或者设置为1，并且子元素中没有se
  if ((!count || count == 1) && !hasSe) {
    return;
  }
  // 2. 设置了se-container，但是子元素没有se，是nz-form-item
  const children = [];
  let temp = [];
  const gutterAttr = item.attributes.find(e => e.key == 'gutter' || e.key == '[gutter]');

  const addEle = (n: HTextNode | HEleNode, arr: HNode[]) => {
    arr.push({
      type: HNodeType.Text,
      content: '\r\n'
    });
    arr.push(n);
  }
  const addRow = () => {
    if (temp.length) {
      temp.push({
        type: HNodeType.Text,
        content: '\r\n'
      });
      addEle({
        type: HNodeType.Element,
        tagName: 'a-row',
        children: temp,
        attributes: gutterAttr ? [{ key: ':gutter', value: gutterAttr.value }] : []
      } as HEleNode, children);
      temp = []
    }
  }
  if (!hasSe) {
    for (let c of item.children) {
      switch (c.type) {
        case HNodeType.Text:
          if (!isEmptyStr(c.content)) {
            addRow();
            addEle(c, children);
          }
          break;
        case HNodeType.Element:
          if ((c as HEleNode).tagName === 'nz-form-item') {
            addEle({
              type: HNodeType.Element,
              tagName: 'a-col',
              attributes: [
                {
                  key: ':span',
                  value: Math.floor(24/count) + ''
                },
              ],
              children: [
                {
                  type: HNodeType.Text,
                  content: '\r\n'
                },
                c,
                {
                  type: HNodeType.Text,
                  content: '\r\n'
                },
              ]
            } as HEleNode, temp);
            if (temp.length == 2 * count) {
              addRow();
            }
          } else {
            addRow();
            addEle(c, children);
          }
      }
    }
    // 可能有剩余最后一个
    addRow();
  } else {
    let seColAttr;
    for (let c of item.children) {
      switch (c.type) {
        case HNodeType.Text:
          if (!isEmptyStr(c.content)) {
            addRow();
            addEle(c, children)
          }
          break;
        case HNodeType.Element:
          if ((c as HEleNode).tagName === 'se') {
            let seCount = count;
            seColAttr = (c as HEleNode).attributes.find(e => e.key == 'col' || e.key == '[col]') as HAttr;
            (c as HEleNode).attributes = (c as HEleNode).attributes.filter(e => e.key !== 'col' && e.key !== '[col]');
            if (seColAttr) {
              seCount = getNum(seColAttr.value, seCount);
            }
            if (!seCount || seCount == 1) {
              addRow();
              addEle(c, children);
            } else {
              addEle({
                type: HNodeType.Element,
                tagName: 'a-col',
                attributes: [
                  {
                    key: ':span',
                    value: Math.floor(24/seCount) + ''
                  },
                ],
                children: [
                  {
                    type: HNodeType.Text,
                    content: '\r\n'
                  },
                  c,
                  {
                    type: HNodeType.Text,
                    content: '\r\n'
                  },
                ]
              } as HEleNode, temp);
              if (temp.length == 2 * seCount) {
                addRow();
              }
            }
          } else {
            addRow();
            addEle(c, children);
          }
      }
    }
    // 可能有剩余最后一个
    addRow();
  }
  item.children = children;
}

// form表单元素属性替换
export function formAttrs(item: HEleNode) {
  // 替换属性
  dealSeContainer(item);
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
          value: `{ style: { width: '${attr.value.endsWith('px') ? attr.value : attr.value + 'px'}'} }`,
        });
        break;
      case attr.key == "se-container":
      case attr.key == "nz-form":
        break;
      default:
        // 别的属性不转
        if (!isRemoveAttr(item, attr)) {
          commonAttrs(attr, newAttrs);
        }
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
