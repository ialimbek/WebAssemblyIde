/** Permission levels for agent actions */
export var PermissionLevel;
(function (PermissionLevel) {
    /** Read-only access */
    PermissionLevel["OBSERVE"] = "observe";
    /** Can suggest changes but not apply */
    PermissionLevel["SUGGEST"] = "suggest";
    /** Can edit files with approval */
    PermissionLevel["EDIT"] = "edit";
    /** Can execute commands with approval */
    PermissionLevel["EXECUTE"] = "execute";
    /** Limited automated execution within policy */
    PermissionLevel["AUTONOMOUS"] = "autonomous";
})(PermissionLevel || (PermissionLevel = {}));
/** Risk levels for operations */
export var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
})(RiskLevel || (RiskLevel = {}));
/** Maps permission levels to minimum risk levels they can handle */
export const RiskLevelMap = {
    [PermissionLevel.OBSERVE]: RiskLevel.LOW,
    [PermissionLevel.SUGGEST]: RiskLevel.LOW,
    [PermissionLevel.EDIT]: RiskLevel.MEDIUM,
    [PermissionLevel.EXECUTE]: RiskLevel.MEDIUM,
    [PermissionLevel.AUTONOMOUS]: RiskLevel.HIGH,
};
//# sourceMappingURL=permissions.js.map