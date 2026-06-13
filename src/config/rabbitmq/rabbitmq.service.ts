import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitmqConfigService {
  constructor(private configService: ConfigService) {}

  get enableRabbitmq(): boolean {
    return this.configService.get<boolean>('enableRabbitmq') as boolean;
  }

  get rabbitmqUri(): string {
    return this.configService.get<string>('rabbitmqUrl') as string;
  }

  get rabbitmqQueue(): string {
    return this.configService.get<string>('rabbitmqQueue') as string;
  }

  get rabbitmqManagementUIPort(): number {
    return this.configService.get<number>('rabbitmqManagementUIPort') as number;
  }

  get username(): string {
    const uri = new URL(this.rabbitmqUri);
    return uri.username;
  }

  get password(): string {
    const uri = new URL(this.rabbitmqUri);
    return uri.password;
  }

  get apiURI(): string {
    const uri = new URL(this.rabbitmqUri);
    return `http://${uri.hostname}:${this.rabbitmqManagementUIPort}/api`;
  }
}
