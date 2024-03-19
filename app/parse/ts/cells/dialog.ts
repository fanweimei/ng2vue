export function replaceDialog(ssrName: string) {
  return (blockSource: string): string => {
    blockSource = blockSource.replace(
      new RegExp(`this.${ssrName}.notification`, "g"),
      ssrName
    );
    return blockSource;
  };
}
