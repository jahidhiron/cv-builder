import {
  RABBITMQ_DEFAULT_MANAGEMENT_UI_PORT,
  RABBITMQ_DEFAULT_QUEUE,
  RABBITMQ_DEFAULT_URI,
} from '@/common/constants';
import { isRabbitmqEnabled } from './rabbitmq-enabled.helper';

export const rabbitmqConfig = () => ({
  enableRabbitmq: isRabbitmqEnabled(),
  rabbitmqUrl: process.env.RABBITMQ_URI || RABBITMQ_DEFAULT_URI,
  rabbitmqQueue: process.env.RABBITMQ_QUEUE || RABBITMQ_DEFAULT_QUEUE,
  rabbitmqManagementUIPort: parseInt(
    process.env.RABBITMQ_MANAGEMENT_UI_PORT ?? RABBITMQ_DEFAULT_MANAGEMENT_UI_PORT,
    10,
  ),
});
