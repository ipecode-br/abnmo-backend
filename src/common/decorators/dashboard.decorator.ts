import { SetMetadata } from '@nestjs/common';

export const IS_DASHBOARD_KEY = 'isDashboard';
export const Dashboard = () => SetMetadata(IS_DASHBOARD_KEY, true);
