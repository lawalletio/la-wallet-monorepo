export type RouteProps = {
  path: string;
  component: ComponentType;
};

export type PluginProps = {
  metadata: {
    author: string;
    title: string;
    description: string;
  };
  routes: RouteProps[];
};
