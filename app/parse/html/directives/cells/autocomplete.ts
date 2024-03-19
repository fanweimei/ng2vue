import { htmlContext } from "../../context";
import { HAttr, HEleNode, HNodeType } from "../../typings";
import { transformFn } from "../../util";

export function autoComponentDirective(item: HEleNode, attr: HAttr) {
  item.attributes = item.attributes.filter((e) => e.key != attr.key);
  const tmplIndex = htmlContext.curParent.children.findIndex((node) => {
    if (
      node.type == HNodeType.Element &&
      node.tagName == "nz-autocomplete" &&
      node.attributes.find((e) => e.key == `#${attr.value}`)
    ) {
      return true;
    }
    return false;
  });
  if (tmplIndex == -1) {
    return;
  }
  const tmplNode = htmlContext.curParent.children.splice(
    tmplIndex,
    1
  )[0] as HEleNode;
  if (tmplNode.attributes.find((e) => e.key == "nzBackfill")) {
    item.attributes.push({
      key: "backfill",
      value: null,
    });
  }
  if (!tmplNode.children?.length) {
    return;
  }
  const autoOptionNode = tmplNode.children.find(
    (e) => e.type == HNodeType.Element && e.tagName == "nz-auto-option"
  ) as HEleNode;
  const forAttr = autoOptionNode.attributes.find((e) => e.key == "*ngFor");
  let optionsStr = "";
  let itemStr = "";
  forAttr.value.replace(/let\s+(.+)\s+of\s+(.+)/, (s0, s1, s2) => {
    optionsStr = s2;
    itemStr = s1;
    return s0;
  });
  if (optionsStr) {
    item.attributes.push({ key: ":options", value: optionsStr });
  }
  const clickAttr = autoOptionNode.attributes.find((e) => e.key == "(click)");
  item.children = [
    {
      type: HNodeType.Text,
      content: "\r\n",
    },
    {
      type: HNodeType.Element,
      tagName: "template",
      attributes: [
        {
          key: "#option",
          value: itemStr,
        },
      ],
      children: [
        {
          type: HNodeType.Text,
          content: "\r\n",
        },
        {
          tagName: "span",
          type: HNodeType.Element,
          attributes: clickAttr
            ? [
                {
                  key: "@click",
                  value: transformFn(clickAttr.value),
                },
              ]
            : [],
        },
        {
          type: HNodeType.Text,
          content: "\r\n",
        },
      ],
    } as HEleNode,
    {
      type: HNodeType.Text,
      content: "\r\n",
    },
  ];
}
