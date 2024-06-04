export function replaceRoute(ssrName: string) {
    return (blockSource: string): string => {
      blockSource = blockSource.replace(
        new RegExp(`this.${ssrName}.snapshot.queryParams.`, "g"),
        `${ssrName}.query.`
      );
      blockSource = blockSource.replace(
        new RegExp(`this.${ssrName}.snapshot.params.`, "g"),
        `${ssrName}.params.`
      );
      return blockSource;
    };
  }