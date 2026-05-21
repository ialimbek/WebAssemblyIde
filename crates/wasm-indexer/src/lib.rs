#![forbid(unsafe_code)]

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::wasm_bindgen;

/// Stable identifier for the indexer service crate.
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub fn service_name() -> String {
    "wasm-indexer".to_owned()
}
