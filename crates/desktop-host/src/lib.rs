#![forbid(unsafe_code)]

/// Stable identifier for the desktop host crate.
pub const DESKTOP_HOST_CRATE_NAME: &str = "desktop-host";

/// Minimal health marker used while the desktop host bridge is bootstrapped.
pub fn crate_name() -> &'static str {
    DESKTOP_HOST_CRATE_NAME
}
