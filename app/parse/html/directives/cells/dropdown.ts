import { findNodeBFS } from "../../util";
import { htmlContext } from "../../context";
import { HAttr, HEleNode, HNode, HNodeType } from "../../typings";
import { defaultDirective } from "./default";

export function dropdownDirective(item: HEleNode, attr: HAttr) {
  const newNode = defaultDirective(item, attr, true);
  const attrIndex = item.attributes.findIndex(
    (e) => e.key == "[nzDropdownMenu]"
  );
  if (attrIndex == -1) {
    return;
  }
  const tempNode = item.attributes.splice(attrIndex, 1)[0];
  let key = `#${tempNode.value}`;
  const tmpNode = findNodeBFS(htmlContext.json, (node: HNode) => {
    if (
      node.type == HNodeType.Element &&
      node.tagName == "nz-dropdown-menu" &&
      node.attributes.find((e) => e.key == key)
    ) {
      return true;
    }
    return false;
  });
  if (!tmpNode) {
    return;
  }
  newNode.children.push({
    type: HNodeType.Element,
    tagName: "template",
    attributes: [{ key: "#overlay", value: null }],
    children: (tmpNode as HEleNode).children,
  });
}
