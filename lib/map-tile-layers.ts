export interface TileLayerDef {
  id: string;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
  /** Rendered as a second TileLayer stacked on top (e.g. a labels layer over imagery). */
  overlayUrl?: string;
}

/**
 * Free, no-API-key tile sources. The Google ones (mt1.google.com) are the
 * commonly-used unofficial tile mirror, not an officially documented public
 * API - it has no key wall today but isn't guaranteed stable long-term. The
 * Esri ones are their official free, keyless ArcGIS Online basemap tiles.
 */
export const TILE_LAYERS: TileLayerDef[] = [
  {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: "streets-google",
    label: "Streets (Google)",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=id",
    attribution: "Imagery &copy; Google",
    maxZoom: 20,
  },
  {
    id: "satellite-google",
    label: "Satellite (Google)",
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&hl=id",
    attribution: "Imagery &copy; Google",
    maxZoom: 20,
  },
  {
    id: "hybrid-google",
    label: "Hybrid (Google)",
    url: "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=id",
    attribution: "Imagery &copy; Google",
    maxZoom: 20,
  },
  {
    id: "terrain-google",
    label: "Terrain (Google)",
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=id",
    attribution: "Imagery &copy; Google",
    maxZoom: 20,
  },
  {
    id: "light",
    label: "Light (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 16,
  },
  {
    id: "dark",
    label: "Dark (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 16,
  },
  {
    id: "satellite-esri",
    label: "Satellite (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
  {
    id: "satellite-esri-labels",
    label: "Satellite + Labels (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    overlayUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
  {
    id: "topo",
    label: "Topographic (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
];
