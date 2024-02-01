export interface BannerAlertProps {
  title: string;
  description: string;
  color?: 'success' | 'warning' | 'error';
}

export interface BannerAlertPrimitiveProps {
  $color: string;
}
