import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

export interface AuditEntry {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  logAudit(entry: AuditEntry) {
    if (!this.supabase.gamePersistenceConfigured) return;
    void this.supabase.insertSecurityLog({
      action: `${entry.method} ${entry.path}`,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      metadata: {
        statusCode: entry.statusCode,
        durationMs: entry.durationMs,
        ...entry.metadata,
      },
    }).catch(error => this.logger.warn(`Không ghi được audit log: ${error.message}`));
  }
}
