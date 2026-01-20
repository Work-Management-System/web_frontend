export enum TenantUserStatus {
    Active = 'Approved',
    Rejected = 'Rejected',
    Pending = 'Pending',
    Blocked = 'Blocked',
    Disabled = 'Disabled',
}

export enum Roles {
    SuperAdmin = 'SuperAdmin',
    Administrator = 'Administrator',
    Manager = 'Manager',
    Employee = 'Employee',
}

export enum PaymentPlatform {
    Online = 'ONLINE',
    Offline = 'OFFLINE',
}

export enum Channel {
    Email = 'Email',
    InAppNotification = 'InAppNotification',
    All = 'All',
}

export enum AnnouncementStatus {
    Sent = 'Sent',
    InProgress = 'InProgress',
    Draft = 'Draft',
    Failed = 'Failed',
}

export enum RoleNames {
    Administrator = 'Administrator',
    All = 'All'
}