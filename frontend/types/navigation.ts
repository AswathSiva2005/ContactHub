import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface DashboardAction {
  title: string;
  description: string;
  icon: IconName;
  route: '/import' | '/batches' | '/search' | '/settings';
  accent: string;
}
