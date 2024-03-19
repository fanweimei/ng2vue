import { HEleNode, HNodeType } from "../../typings";
import { defaultAttrs } from "./default";

export function selectAttrs(item: HEleNode) {
  defaultAttrs(item);
  item.attributes.push({
    key: "option-label-prop",
    value: "children",
  });
  item.attributes.push({
    key: "option-filter-prop",
    value: "label",
  });
  for (let c of item.children) {
    if (c.type !== HNodeType.Element || c.tagName !== "nz-option") {
      continue;
    }
    if (c.children?.find((e) => e.type === HNodeType.Element)) {
      continue;
    }
    let attr = c.attributes.find(
      (e) => e.key == "nzLabel" || e.key == "[nzLabel]"
    );
    if (!attr) {
      continue;
    }
    c.children = [
      {
        type: HNodeType.Text,
        content: attr.key == "nzLabel" ? attr.value : `{{${attr.value}}}`,
      },
    ];
  }
}
