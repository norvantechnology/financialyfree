export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ResponseMeta;
}
export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}
export interface ResponseMeta {
    requestId?: string;
    timestamp: string;
    version?: string;
}
export interface NotificationDto {
    id: string;
    userId: string;
    type: 'sip_reminder' | 'webinar_reminder' | 'course_progress' | 'kyc_status' | 'payment' | 'general';
    title: string;
    message: string;
    isRead: boolean;
    channel: 'in_app' | 'email' | 'whatsapp' | 'push';
    createdAt: string;
}
//# sourceMappingURL=api-response.types.d.ts.map