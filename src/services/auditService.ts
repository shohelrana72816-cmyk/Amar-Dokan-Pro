import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuditLog } from '../types';

export const auditService = {
  async logAction(log: Omit<AuditLog, 'id' | 'date'>): Promise<AuditLog> {
    const fullLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('audit_logs').insert({
          action: log.action,
          entity_type: log.entityType,
          entity_id: log.entityId,
          details: log.details,
          branch_id: log.branchId,
          user_role: log.userRole,
        });
      } catch (err) {
        console.warn('Supabase audit log insert fallback to local:', err);
      }
    }

    return fullLog;
  },

  async fetchLogs(businessId?: string): Promise<AuditLog[]> {
    if (isSupabaseConfigured) {
      try {
        const query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
        if (businessId) query.eq('business_id', businessId);
        const { data, error } = await query;
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            date: d.created_at,
            userRole: d.user_role || 'staff',
            action: d.action,
            entityType: d.entity_type,
            entityId: d.entity_id,
            details: d.details || '',
            branchId: d.branch_id,
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch audit logs error, using local state:', err);
      }
    }
    return [];
  },
};
