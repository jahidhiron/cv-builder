import { PERMISSIONS_KEY } from '@/modules/auth/decorators/require-permissions.decorator';
import { SKIP_PERMISSIONS_KEY } from '@/modules/auth/decorators/skip-permissions.decorator';
import { UserPayload } from '@/modules/auth/interfaces';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

const METHOD_ACTION_MAP: Record<string, string> = {
  GET: 'read',
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const explicit = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    let required: string[];

    if (explicit?.length) {
      required = explicit;
    } else {
      const request = context.switchToHttp().getRequest<Request>();
      const controllerPath = (Reflect.getMetadata(PATH_METADATA, context.getClass()) as string) ?? '';
      const resource = controllerPath.replace(/^\//, '');
      const action = METHOD_ACTION_MAP[request.method] ?? 'read';
      required = [`${resource}:${action}`];
    }

    const { user } = context.switchToHttp().getRequest<Request & { user?: UserPayload }>();
    const hasAll = required.every((p) => user?.permissions?.includes(p));

    if (!hasAll) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
