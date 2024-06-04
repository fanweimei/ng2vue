// import { arrayIncludes } from "./compat";
import { isSelfElement } from "./tags";

export function formatAttributes(attributes) {
  return attributes.reduce((attrs, attribute) => {
    let { key, value } = attribute;
    if (value === null) {
      return `${attrs} ${key}`;
    }
    // const quoteEscape = value.indexOf("'") !== -1;
    if(typeof value == "string") {
      value = value.replace(/"/g, `'`).replace(/\n/g, "").replace(/\r/g, "");
    }
    // const quote = quoteEscape ? '"' : "'"
    const quote = `"`;
    return `${attrs} ${key}=${quote}${value}${quote}`;
  }, "");
}

export function toHTML(tree, options) {
  return tree
    .map((node) => {
      if (node.type === "text") {
        return node.content;
      }
      if (node.type === "comment") {
        return `<!--${node.content}-->`;
      }
      const { tagName, attributes, children } = node;
      const isSelfClosing = isSelfElement(tagName);
      return isSelfClosing
        ? `<${tagName}${formatAttributes(attributes)} />`
        : `<${tagName}${formatAttributes(attributes)}>${toHTML(
            children,
            options
          )}</${tagName}>`;
    })
    .join("");
}

export default { toHTML };
