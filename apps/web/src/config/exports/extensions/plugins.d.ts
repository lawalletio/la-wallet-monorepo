export type RouteProps = {
  path: string;
  getComponent: () => ComponentType;
};

export type PluginProps = {
  metadata: {
    author: string;
    title: string;
    description: string;
  };
  routes: RouteProps[];
};
