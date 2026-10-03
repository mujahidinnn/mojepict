"use client";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "@/lib/leaflet-global";
import "@geoman-io/leaflet-geoman-free";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import area from "@turf/area";
import length from "@turf/length";
import union from "@turf/union";
import { feature, featureCollection, lineString } from "@turf/helpers";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { TILE_LAYERS } from "@/lib/map-tile-layers";
import {
  Circle,
  Combine,
  Download,
  ImagePlus,
  MapPin,
  MapPinPlus,
  Move,
  Pencil,
  Pentagon,
  Printer,
  RotateCw,
  Scissors,
  Spline,
  Square,
  Trash2,
  Upload,
} from "lucide-react";

// Bundlers break Leaflet's relative default-marker image URLs; point them at
// the copies this repo self-hosts in public/leaflet/ instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

/** Explains the icon-only toolbar Geoman draws on the map (top-left) - it has no labels of its own. */
const TOOLBAR_GUIDE = [
  { icon: MapPin, labelKey: "toolMarker" },
  { icon: Spline, labelKey: "toolLine" },
  { icon: Square, labelKey: "toolRectangle" },
  { icon: Pentagon, labelKey: "toolPolygon" },
  { icon: Circle, labelKey: "toolCircle" },
  { icon: Pencil, labelKey: "toolEdit" },
  { icon: Move, labelKey: "toolDrag" },
  { icon: Scissors, labelKey: "toolCut" },
  { icon: Trash2, labelKey: "toolRemove" },
  { icon: RotateCw, labelKey: "toolRotate" },
] as const;

type TaggedLayer = L.Layer & { feature?: GeoJSON.Feature; _mapEditorId?: number };

interface FeatureRow {
  id: number;
  type: string;
  name: string;
  measurement: string;
}

interface ImageOverlayEntry {
  overlay: L.ImageOverlay;
  handle: L.Rectangle;
}

let nextId = 1;

function tagLayer(layer: L.Layer) {
  const l = layer as TaggedLayer;
  if (l._mapEditorId == null) l._mapEditorId = nextId++;
  if (!l.feature) l.feature = { type: "Feature", properties: {}, geometry: null as unknown as GeoJSON.Geometry };
  l.feature.properties = l.feature.properties ?? {};
  l.feature.properties.id = l._mapEditorId;
  return l._mapEditorId;
}

function shapeLabel(layer: L.Layer): string {
  if (layer instanceof L.Marker) return "Marker";
  if (layer instanceof L.Circle) return "Circle";
  if (layer instanceof L.Rectangle) return "Rectangle";
  if (layer instanceof L.Polygon) return "Polygon";
  if (layer instanceof L.Polyline) return "Line";
  return "Shape";
}

function formatArea(m2: number): string {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`;
  if (m2 >= 10_000) return `${(m2 / 10_000).toFixed(2)} ha`;
  return `${m2.toFixed(0)} m²`;
}

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m.toFixed(0)} m`;
}

/** Distance/area/perimeter summary for a layer, used in the table and exported alongside the geometry. */
function measureLayer(layer: L.Layer): string {
  if (layer instanceof L.Circle) {
    const r = layer.getRadius();
    return `${formatArea(Math.PI * r * r)} · ${formatDistance(2 * Math.PI * r)} keliling`;
  }
  // Freshly-drawn layers don't carry a populated .feature until exported, so
  // read geometry straight from Leaflet's own toGeoJSON() instead.
  const withGeoJson = layer as unknown as { toGeoJSON?: () => GeoJSON.Feature };
  const geom = withGeoJson.toGeoJSON?.()?.geometry;
  if (!geom) return "";
  try {
    if (geom.type === "LineString" || geom.type === "MultiLineString") {
      return `${formatDistance(length(feature(geom), { units: "kilometers" }) * 1000)} jarak`;
    }
    if (geom.type === "Polygon") {
      const perimeter = length(lineString(geom.coordinates[0]), { units: "kilometers" }) * 1000;
      return `${formatArea(area(geom))} · ${formatDistance(perimeter)} keliling`;
    }
    if (geom.type === "MultiPolygon") {
      const perimeter = geom.coordinates.reduce(
        (sum, poly) => sum + length(lineString(poly[0]), { units: "kilometers" }) * 1000,
        0,
      );
      return `${formatArea(area(geom))} · ${formatDistance(perimeter)} keliling`;
    }
  } catch {
    return "";
  }
  return "";
}

/**
 * MapContainer's `ref`/`whenReady` can fire before React has actually
 * propagated the map instance to the ref (whenReady is Leaflet's own
 * map.whenReady, which can resolve before the next render), so geoman setup
 * instead runs from a child that calls react-leaflet's useMap() - that hook
 * is only populated once the map genuinely exists in context.
 */
function MapSetup({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    onReady(map);
  }, [map, onReady]);
  return null;
}

export default function MapEditorPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const imageOverlaysRef = useRef<ImageOverlayEntry[]>([]);

  const [tileId, setTileId] = useState(TILE_LAYERS[0].id);
  const [rows, setRows] = useState<FeatureRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [jsonText, setJsonText] = useState("");
  const [cutModeActive, setCutModeActive] = useState(false);
  const [lat, setLat] = useState("-6.2088");
  const [lng, setLng] = useState("106.8456");

  const tile = TILE_LAYERS.find((l) => l.id === tileId) ?? TILE_LAYERS[0];

  const refreshRows = useCallback(() => {
    const fg = featureGroupRef.current;
    if (!fg) return;
    const next: FeatureRow[] = [];
    fg.eachLayer((layer) => {
      const l = layer as TaggedLayer;
      const id = tagLayer(l);
      next.push({
        id,
        type: shapeLabel(l),
        name: (l.feature?.properties?.name as string) ?? "",
        measurement: measureLayer(l),
      });
    });
    setRows(next);
    setSelected((prev) => new Set([...prev].filter((id) => next.some((r) => r.id === id))));
    setJsonText(JSON.stringify(fg.toGeoJSON(), null, 2));
  }, []);

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const findLayer = useCallback((id: number): TaggedLayer | undefined => {
    let found: TaggedLayer | undefined;
    featureGroupRef.current?.eachLayer((layer) => {
      if ((layer as TaggedLayer)._mapEditorId === id) found = layer as TaggedLayer;
    });
    return found;
  }, []);

  const renameFeature = (id: number, name: string) => {
    const layer = findLayer(id);
    if (!layer || !layer.feature) return;
    layer.feature.properties = { ...layer.feature.properties, name };
    const bindable = layer as unknown as { bindPopup?: (c: string) => void };
    if (name) bindable.bindPopup?.(name);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  };

  const focusFeature = (id: number) => {
    const layer = findLayer(id);
    if (!layer || !mapRef.current) return;
    const anyLayer = layer as unknown as { getBounds?: () => L.LatLngBounds; getLatLng?: () => L.LatLng };
    if (anyLayer.getBounds) mapRef.current.fitBounds(anyLayer.getBounds(), { maxZoom: 17 });
    else if (anyLayer.getLatLng) mapRef.current.setView(anyLayer.getLatLng(), Math.max(mapRef.current.getZoom(), 15));
  };

  const removeFeature = (id: number) => {
    const layer = findLayer(id);
    if (layer) featureGroupRef.current?.removeLayer(layer);
    refreshRows();
  };

  const setupMap = useCallback((map: L.Map) => {
    mapRef.current = map;
    if (featureGroupRef.current) return;

    const fg = L.featureGroup().addTo(map);
    featureGroupRef.current = fg;

    map.pm.setGlobalOptions({ layerGroup: fg });
    map.pm.addControls({ position: "topleft", drawText: false });

    map.on("pm:create", (e) => {
      tagLayer(e.layer);
      fg.addLayer(e.layer);
      refreshRows();
    });
    map.on("pm:remove", refreshRows);
    map.on("pm:edit", refreshRows);
    map.on("pm:dragend", refreshRows);
    map.on("pm:cut", (e) => {
      tagLayer(e.layer);
      refreshRows();
    });
    map.on("pm:globalcutmodetoggled", (e) => setCutModeActive(e.enabled));
  }, [refreshRows]);

  const addPointMarker = () => {
    const la = parseFloat(lat);
    const lo = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(lo) || !featureGroupRef.current || !mapRef.current) return;
    const marker = L.marker([la, lo]);
    tagLayer(marker);
    featureGroupRef.current.addLayer(marker);
    mapRef.current.setView([la, lo], Math.max(mapRef.current.getZoom(), 13));
    refreshRows();
  };

  /** Adds every feature in a GeoJSON payload to the map, replacing the current content first when `replace` is set (used by the JSON editor's "Apply"). */
  const loadGeoJson = useCallback(
    (data: unknown, { replace }: { replace?: boolean } = {}) => {
      const fg = featureGroupRef.current;
      if (!fg) return;
      if (replace) fg.clearLayers();
      const imported = L.geoJSON(data as GeoJSON.GeoJsonObject);
      imported.eachLayer((layer) => {
        tagLayer(layer);
        fg.addLayer(layer);
      });
      if (mapRef.current) {
        const bounds = fg.getBounds();
        if (bounds.isValid()) mapRef.current.fitBounds(bounds, { maxZoom: 17 });
      }
      refreshRows();
    },
    [refreshRows],
  );

  const importGeoJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      loadGeoJson(data);
      toast({ title: t("common.success"), description: t("toast.success.processed") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("tool.map-editor.invalidGeoJson") });
    }
  };

  const applyJsonEdit = () => {
    try {
      const data = JSON.parse(jsonText);
      loadGeoJson(data, { replace: true });
      setSelected(new Set());
      toast({ title: t("common.success"), description: t("toast.success.processed") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("tool.map-editor.invalidGeoJson") });
    }
  };

  const mergeSelected = () => {
    const layers = [...selected].map(findLayer).filter((l): l is TaggedLayer => !!l);
    const features = layers
      .map((l) => (l as unknown as { toGeoJSON: () => GeoJSON.Feature }).toGeoJSON())
      .filter((f): f is GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon");

    if (features.length < 2) {
      toast({ variant: "destructive", title: t("common.error"), description: t("tool.map-editor.needTwoPolygons") });
      return;
    }
    try {
      const merged = union(featureCollection(features));
      if (!merged) throw new Error("union returned null");
      layers.forEach((l) => featureGroupRef.current?.removeLayer(l));
      const newLayer = L.geoJSON(merged).getLayers()[0];
      tagLayer(newLayer);
      featureGroupRef.current?.addLayer(newLayer);
      setSelected(new Set());
      refreshRows();
      toast({ title: t("common.success"), description: t("toast.success.processed") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("tool.map-editor.mergeFailed") });
    }
  };

  /** Splitting a polygon has no free-tier "split" tool in Geoman - cutting it with a
   * shape drawn straight across does the same job via a boolean difference, and the
   * two resulting pieces come back as one MultiPolygon feature, which is valid GeoJSON. */
  const toggleSplitMode = () => {
    const map = mapRef.current;
    if (!map) return;
    map.pm.toggleGlobalCutMode();
    setCutModeActive(map.pm.globalCutModeEnabled());
  };

  const printMap = () => window.print();

  const exportGeoJson = () => {
    const fg = featureGroupRef.current;
    if (!fg) return;
    const data = fg.toGeoJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "map.geojson";
    a.click();
    URL.revokeObjectURL(url);
  };

  const addImageOverlay = (file: File) => {
    const map = mapRef.current;
    if (!map) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const bounds = map.getBounds().pad(-0.25);
      const overlay = L.imageOverlay(dataUrl, bounds, { opacity: 0.9 }).addTo(map);
      const handle = L.rectangle(bounds, { color: "#8b5cf6", weight: 1, fillOpacity: 0, dashArray: "4" }).addTo(map);
      handle.pm.enable({ allowSelfIntersection: false });
      const sync = () => overlay.setBounds(handle.getBounds());
      handle.on("pm:dragend", sync);
      handle.on("pm:markerdragend", sync);
      handle.on("pm:edit", sync);
      imageOverlaysRef.current.push({ overlay, handle });
    };
    reader.readAsDataURL(file);
  };

  const clearImageOverlays = () => {
    imageOverlaysRef.current.forEach(({ overlay, handle }) => {
      mapRef.current?.removeLayer(overlay);
      mapRef.current?.removeLayer(handle);
    });
    imageOverlaysRef.current = [];
  };

  return (
    <ToolShell title={t("tool.map-editor.name")} description={t("tool.map-editor.description")} fullWidth>
      <ToolWorkspace
        sidebar={
          <div className="contents print:hidden">
            <Card className="space-y-3 p-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("tool.map-editor.toolbarGuide")}
              </Label>
              <p className="text-xs text-muted-foreground">{t("tool.map-editor.toolbarGuideHint")}</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                {TOOLBAR_GUIDE.map(({ icon: Icon, labelKey }) => (
                  <div key={labelKey} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t(`tool.map-editor.${labelKey}` as const)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-3 p-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("tool.map-editor.step1")}
              </Label>
              <Select value={tileId} onValueChange={setTileId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TILE_LAYERS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            <Card className="space-y-3 p-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("tool.map-editor.step2")}
              </Label>
              <p className="text-xs text-muted-foreground">{t("tool.map-editor.step2Hint")}</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder={t("tool.map-editor.lat")}
                  inputMode="decimal"
                />
                <Input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder={t("tool.map-editor.lng")}
                  inputMode="decimal"
                />
              </div>
              <Button type="button" variant="outline" className="w-full gap-2" onClick={addPointMarker}>
                <MapPinPlus className="h-4 w-4" />
                {t("tool.map-editor.addPointBtn")}
              </Button>

              <div className="border-t pt-3 space-y-2">
                <p className="text-xs text-muted-foreground">{t("tool.map-editor.imageOverlayHint")}</p>
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2 text-sm hover:bg-muted/40">
                  <ImagePlus className="h-4 w-4" />
                  {t("tool.map-editor.uploadImage")}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) addImageOverlay(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {imageOverlaysRef.current.length > 0 && (
                  <Button type="button" variant="ghost" size="sm" className="w-full gap-2" onClick={clearImageOverlays}>
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("tool.map-editor.clearImages")}
                  </Button>
                )}
              </div>
            </Card>

            <Card className="space-y-3 p-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("tool.map-editor.step3")}
              </Label>
              <p className="text-xs text-muted-foreground">{t("tool.map-editor.mergeHint")}</p>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={mergeSelected}
                disabled={selected.size < 2}
              >
                <Combine className="h-4 w-4" />
                {t("tool.map-editor.merge")} {selected.size > 0 && `(${selected.size})`}
              </Button>
              <p className="text-xs text-muted-foreground">{t("tool.map-editor.splitHint")}</p>
              <Button
                type="button"
                variant={cutModeActive ? "default" : "outline"}
                className="w-full gap-2"
                onClick={toggleSplitMode}
              >
                <Scissors className="h-4 w-4" />
                {cutModeActive ? t("tool.map-editor.splitActive") : t("tool.map-editor.split")}
              </Button>
            </Card>

            <Card className="space-y-3 p-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("tool.map-editor.step4")}
              </Label>
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2 text-sm hover:bg-muted/40">
                <Upload className="h-4 w-4" />
                {t("tool.map-editor.import")}
                <input
                  type="file"
                  accept=".geojson,.json,application/geo+json"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importGeoJson(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <Button type="button" variant="outline" className="w-full gap-2" onClick={exportGeoJson} disabled={!rows.length}>
                <Download className="h-4 w-4" />
                {t("tool.map-editor.export")}
              </Button>
              <Button type="button" variant="outline" className="w-full gap-2" onClick={printMap}>
                <Printer className="h-4 w-4" />
                {t("tool.map-editor.print")}
              </Button>
            </Card>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="h-[520px] w-full overflow-hidden rounded-xl border print:h-screen print:w-screen print:rounded-none print:border-0">
            <MapContainer center={[-6.2088, 106.8456]} zoom={12} className="h-full w-full">
              <TileLayer key={tile.id} url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} />
              {tile.overlayUrl && (
                <TileLayer key={`${tile.id}-overlay`} url={tile.overlayUrl} maxZoom={tile.maxZoom} />
              )}
              <MapSetup onReady={setupMap} />
            </MapContainer>
          </div>

          <Tabs defaultValue="table" className="space-y-2 print:hidden">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("tool.map-editor.table")} ({rows.length})
              </Label>
              <TabsList className="h-8">
                <TabsTrigger value="table" className="text-xs">
                  {t("tool.map-editor.tabTable")}
                </TabsTrigger>
                <TabsTrigger value="json" className="text-xs">
                  {t("tool.map-editor.tabJson")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="table" className="space-y-2">
              {rows.length === 0 ? (
                <p className="rounded-lg border bg-muted/10 p-4 text-sm text-muted-foreground">
                  {t("tool.map-editor.tableEmpty")}
                </p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {rows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2 rounded-lg border bg-muted/10 p-2">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="h-4 w-4 shrink-0 rounded border-input accent-primary"
                        aria-label={t("tool.map-editor.selectForMerge")}
                      />
                      <button
                        type="button"
                        onClick={() => focusFeature(row.id)}
                        className="shrink-0 rounded bg-muted px-2 py-1 text-xs font-medium hover:bg-muted/70"
                      >
                        {row.type}
                      </button>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Input
                          value={row.name}
                          onChange={(e) => renameFeature(row.id, e.target.value)}
                          placeholder={t("tool.map-editor.namePlaceholder")}
                          className="h-8"
                        />
                        {row.measurement && (
                          <span className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.measurement}</span>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeFeature(row.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="json" className="space-y-2">
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
                className="h-64 resize-none font-mono text-xs"
              />
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={applyJsonEdit}>
                <Upload className="h-3.5 w-3.5" />
                {t("tool.map-editor.applyJson")}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </ToolWorkspace>
    </ToolShell>
  );
}
