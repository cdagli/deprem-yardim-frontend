import Map from "@/components/UI/Map/Map";
import { MarkerData } from "@/mocks/types";
import { useMapActions } from "@/stores/mapStore";
import { HeatmapLayerFactory } from "@vgrid/react-leaflet-heatmap-layer";
import { LeafletMouseEvent, SpiderfyEventHandlerFn } from "leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import React, { Fragment, useCallback, useMemo, useRef } from "react";
import { Marker, MarkerProps, TileLayer, useMapEvents } from "react-leaflet";
import {
  DEFAULT_CENTER,
  DEFAULT_IMPORTANCY,
  DEFAULT_MIN_ZOOM,
  DEFAULT_ZOOM,
} from "./utils";

type Point = [number, number, number];

const HeatmapLayer = React.memo(HeatmapLayerFactory<Point>());

const MarkerClusterGroup = dynamic(() => import("./MarkerClusterGroup"), {
  ssr: false,
});

const MapLegend = dynamic(() => import("./MapLegend"), {
  ssr: false,
});

// const ImpactedCities = dynamic(() => import("./ImpactedCities"), {
//   ssr: false,
// });

type Props = {
  data: MarkerData[];
  onClickMarker: (_e: LeafletMouseEvent, _markerData: MarkerData) => void;
  onClusterClick: SpiderfyEventHandlerFn;
};

type ExtendedMarkerProps = MarkerProps & {
  markerData: MarkerData;
};

function ExtendedMarker({ ...props }: ExtendedMarkerProps) {
  return <Marker {...props} />;
}

const MapEvents = () => {
  const mapZoomLevelRef = useRef(0);
  const { setCoordinates, setPopUpData } = useMapActions();

  const map = useMapEvents({
    moveend: () => setCoordinates(map.getBounds()),
    zoomend: () => {
      setCoordinates(map.getBounds());

      const isZoomOut = mapZoomLevelRef.current > map.getZoom();
      if (isZoomOut) {
        setPopUpData(null);
      }
    },
    zoomstart: () => {
      mapZoomLevelRef.current = map.getZoom();
    },
  });

  return null;
};

function LeafletMap({ onClickMarker, data, onClusterClick }: Props) {
  const points: Point[] = useMemo(
    () =>
      data.map((marker: MarkerData) => [
        marker.geometry.location.lat,
        marker.geometry.location.lng,
        DEFAULT_IMPORTANCY,
      ]),
    [data]
  );

  const longitudeExtractor = useCallback((p: Point) => p[1], []);
  const latitudeExtractor = useCallback((p: Point) => p[0], []);
  const intensityExtractor = useCallback((p: Point) => p[2], []);

  return (
    <>
      <MapLegend />

      <Map
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={DEFAULT_MIN_ZOOM}
        preferCanvas
      >
        <MapEvents />
        {/* <ImpactedCities /> */}
        <HeatmapLayer
          fitBoundsOnLoad
          fitBoundsOnUpdate
          radius={15}
          points={points}
          longitudeExtractor={longitudeExtractor}
          latitudeExtractor={latitudeExtractor}
          intensityExtractor={intensityExtractor}
        />
        <TileLayer
          url={`https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}&apistyle=s.e%3Al.i%7Cp.v%3Aoff%2Cs.t%3A3%7Cs.e%3Ag%7C`}
        />
        {/* @ts-expect-error */}
        <MarkerClusterGroup onClick={onClusterClick}>
          {data.map((marker: MarkerData) => (
            <Fragment key={marker.place_id}>
              <ExtendedMarker
                key={marker.place_id}
                position={[
                  marker.geometry.location.lat,
                  marker.geometry.location.lng,
                ]}
                eventHandlers={{
                  click: (e) => {
                    onClickMarker(e, marker);
                  },
                }}
                markerData={marker}
              />
            </Fragment>
          ))}
        </MarkerClusterGroup>
      </Map>
    </>
  );
}

export default React.memo(LeafletMap);
