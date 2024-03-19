export enum HNodeType {
  Text = "text",
  Element = "element",
  Comment = "comment",
}
export interface HAttr {
  key: string;
  value: string | null;
}
export interface HTextNode {
  _p?: HEleNode;
  type: "text";
  content: string;
  level?: number;
}
export interface HCommentNode {
  _p?: HEleNode;
  type: "comment";
  content: string;
  level?: number;
}
export interface HEleNode {
  _p?: HEleNode;
  type: "element";
  attributes: Array<HAttr>;
  children: Array<HNode>;
  tagName: string;
  level?: number;
}
export type HNode = HTextNode | HEleNode | HCommentNode;

export enum TagType {
  form = "form",
  st = "st",
  tree = "tree",
  sf = "sf",
}
