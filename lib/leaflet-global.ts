import L from "leaflet";

/**
 * leaflet-geoman's dist build is a plain script expecting a global `L` (true
 * when Leaflet is loaded via <script>, not as an ES import). Importing this
 * module before "@geoman-io/leaflet-geoman-free" guarantees `window.L` is
 * set first - ESM side-effect imports run in declaration order, so as long
 * as this import line comes before geoman's, this module's own top-level
 * code (including this assignment) finishes before geoman's runs.
 */
if (typeof window !== "undefined") {
  (window as typeof window & { L?: typeof L }).L = L;
}

export default L;
