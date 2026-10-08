import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuditLog } from '../types';

export const auditService = {
  async logAction(
    log: Omit<AuditLog, 'id' | 'date'>,
    businessId?: string,
    userId?: string
  ): Promise<AuditLog> {
    const fullLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const payload: any = {
          action: log.action,
          entity_type: log.entityType,
          entity_id: log.entityId,
          details: log.details,
          branch_id: log.branchId || null,
          user_role: log.userRole,
        };
        if (businessId) payload.business_id = businessId;
        if (userId) payload.user_id = userId;

        const { error } = await supabase.from('audit_logs').insert(payload);
        if (error) {
          console.warn('Supabase audit log insert notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase audit log insert error:', err);
      }
    }

    return fullLog;
  },

  async fetchLogs(businessId?: string): Promise<AuditLog[]> {
    if (!isSupabaseConfigured) return [];
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      return (data || []).map((d: any) => ({
        id: d.id,
        date: d.created_at,
        userRole: d.user_role || 'staff',
        action: d.action,
        entityType: d.entity_type,
        entityId: d.entity_id,
        details: d.details || '',
        branchId: d.branch_id,
      }));
    } catch (err) {
      console.warn('Supabase fetch audit logs error:', err);
      return [];
    }
  },
};
