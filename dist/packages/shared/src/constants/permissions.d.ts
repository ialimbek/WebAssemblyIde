/** Permission levels for agent actions */
export declare enum PermissionLevel {
    /** Read-only access */
    OBSERVE = "observe",
    /** Can suggest changes but not apply */
    SUGGEST = "suggest",
    /** Can edit files with approval */
    EDIT = "edit",
    /** Can execute commands with approval */
    EXECUTE = "execute",
    /** Limited automated execution within policy */
    AUTONOMOUS = "autonomous"
}
/** Risk levels for operations */
export declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
/** Maps permission levels to minimum risk levels they can handle */
export declare const RiskLevelMap: Record<PermissionLevel, RiskLevel>;
//# sourceMappingURL=permissions.d.ts.map