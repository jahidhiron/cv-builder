import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RealtimeConfigService {
  constructor(private configService: ConfigService) {}

  get clientSocketUrl(): string {
    return this.configService.get<string>("clientSocketUrl") as string;
  }
}
