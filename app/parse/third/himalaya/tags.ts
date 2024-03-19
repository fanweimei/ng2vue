/*
  Tags which contain arbitary non-parsed content
  For example: <script> JavaScript should not be parsed
*/
import { arrayIncludes } from "./compat";
export const childlessTags = ["style", "script", "template"];

/*
  Tags which auto-close because they cannot be nested
  For example: <p>Outer<p>Inner is <p>Outer</p><p>Inner</p>
*/
export const closingTags = [
  "html",
  "head",
  "body",
  "p",
  "dt",
  "dd",
  "li",
  "option",
  "thead",
  "th",
  "tbody",
  "tr",
  "td",
  "tfoot",
  "colgroup",
];

/*
  Closing tags which have ancestor tags which
  may exist within them which prevent the
  closing tag from auto-closing.
  For example: in <li><ul><li></ul></li>,
  the top-level <li> should not auto-close.
*/
export const closingTagAncestorBreakers = {
  li: ["ul", "ol", "menu"],
  dt: ["dl"],
  dd: ["dl"],
  tbody: ["table"],
  thead: ["table"],
  tfoot: ["table"],
  tr: ["table"],
  td: ["table"],
};

/*
  Tags which do not need the closing tag
  For example: <img> does not need </img>
*/
export const voidTags = [
  "!doctype",
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];

export const antvVoidTags = [
  "a-divider",
  "a-input",
  "a-textarea",
  "a-spin",
  "a-alert",
];

export function isSelfElement(tagName) {
  let tag = tagName.toLowerCase();
  const isSelf = arrayIncludes(voidTags, tag);
  if (isSelf) {
    return true;
  }

  // 是否是antv icon
  if (
    tag.endsWith("filled") ||
    tag.endsWith("outlined") ||
    tag.endsWith("two-tone")
  ) {
    return true;
  }
  return !!antvVoidTags[tagName];
}
