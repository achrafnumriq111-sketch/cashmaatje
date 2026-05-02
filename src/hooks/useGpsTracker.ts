// Always-on GPS tracker (zolang tabblad open is).
// Detecteert ritten op basis van beweging: rit start bij snelheid > MIN_SPEED, eindigt na STOP_TIMEOUT stilstand.
import { useEffect, useRef, useState, useCallback } from "react";

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
  speedKmh: number;
}

export interface DetectedTrip {
  startedAt: number;
  endedAt: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  km: number;
  points: GpsPoint[];
}

const MIN_SPEED_KMH = 8; // Onder dit ben je waarschijnlijk niet aan het rijden
const STOP_TIMEOUT_MS = 3 * 60 * 1000; // 3 min stilstand = rit klaar
const MIN_TRIP_KM = 0.5; // Onder dit negeren we (foutjes)

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface GpsTrackerState {
  active: boolean;
  status: "idle" | "watching" | "moving";
  currentSpeed: number;
  currentKm: number;
  lastPoint: GpsPoint | null;
  error: string | null;
}

export function useGpsTracker(onTripDetected: (trip: DetectedTrip) => void) {
  const [state, setState] = useState<GpsTrackerState>({
    active: false,
    status: "idle",
    currentSpeed: 0,
    currentKm: 0,
    lastPoint: null,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const pointsRef = useRef<GpsPoint[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const onTripRef = useRef(onTripDetected);
  onTripRef.current = onTripDetected;

  const finalizeTrip = useCallback(() => {
    const pts = pointsRef.current;
    if (pts.length < 2) {
      pointsRef.current = [];
      return;
    }
    let km = 0;
    for (let i = 1; i < pts.length; i++) {
      km += haversine(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
    }
    if (km >= MIN_TRIP_KM) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      onTripRef.current({
        startedAt: first.timestamp,
        endedAt: last.timestamp,
        startLat: first.lat,
        startLng: first.lng,
        endLat: last.lat,
        endLng: last.lng,
        km: Number((km * 1.3).toFixed(1)), // wegfactor
        points: pts,
      });
    }
    pointsRef.current = [];
    setState((s) => ({ ...s, status: "watching", currentKm: 0 }));
  }, []);

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      const speedKmh = pos.coords.speed != null ? pos.coords.speed * 3.6 : 0;
      const point: GpsPoint = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: pos.timestamp,
        speedKmh,
      };

      const moving = speedKmh >= MIN_SPEED_KMH;

      if (moving) {
        if (stopTimerRef.current) {
          window.clearTimeout(stopTimerRef.current);
          stopTimerRef.current = null;
        }
        pointsRef.current.push(point);
        let km = 0;
        const pts = pointsRef.current;
        for (let i = 1; i < pts.length; i++) {
          km += haversine(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
        }
        setState((s) => ({
          ...s,
          status: "moving",
          currentSpeed: speedKmh,
          currentKm: Number((km * 1.3).toFixed(1)),
          lastPoint: point,
        }));
      } else {
        // stilstand
        if (pointsRef.current.length > 0 && !stopTimerRef.current) {
          stopTimerRef.current = window.setTimeout(finalizeTrip, STOP_TIMEOUT_MS);
        }
        setState((s) => ({ ...s, currentSpeed: speedKmh, lastPoint: point }));
      }
    },
    [finalizeTrip]
  );

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocatie niet ondersteund" }));
      return;
    }
    if (watchIdRef.current != null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => setState((s) => ({ ...s, error: err.message })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
    );
    setState((s) => ({ ...s, active: true, status: "watching", error: null }));
  }, [handlePosition]);

  const stop = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (pointsRef.current.length > 1) finalizeTrip();
    pointsRef.current = [];
    setState({
      active: false,
      status: "idle",
      currentSpeed: 0,
      currentKm: 0,
      lastPoint: null,
      error: null,
    });
  }, [finalizeTrip]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    };
  }, []);

  return { ...state, start, stop };
}
